/**
 * Unified chart registry: each row defines a tax metric (`compute`), optional Sankey structural nodes, Mekko/summary
 * hints, and serialization order. See {@link CHART_REGISTRY}.
 *
 * **Evaluation contract:** Tax math for chart metrics runs only through {@link computeTaxMetricLines}. Each registry
 * `compute` mutates {@link ChartMetricComputeContext.accreted} on demand (calling private `accrete*` helpers that wrap
 * the former pipeline steps). There is no {@link TaxPipelineSnapshot} object or separate pipeline builder—only this
 * loop and shared helpers. The only preparation outside this module is resolving which {@link TaxYearConfig} applies.
 *
 * **Detailed display list:** Rows with {@link ChartRegistryEntry.detailedDisplay} drive {@link buildDisplayItemsConfig}
 * (single add/remove point with the registry).
 *
 * **Sankey:** Optional {@link ChartRegistryEntry.sankey} `phase` + `append` contribute nodes/links when
 * {@link sankeyRegistryRunner.runSankeyRegistryAppendersForPhase} runs for that phase. Not every metric maps 1:1 to graph elements (e.g. gross
 * uses one node per income form row); unmigrated phases still use `taxCharts.sankeyPhase*` helpers.
 *
 * **Income column order:** {@link INCOME_KIND_SANKEY_ORDER} / {@link INCOME_KIND_CHART_ORDER_BY_KIND} come from
 * `sankey.incomeKindVerticalOrder` on the gross-income rows whose `visualizationSourceId` is an {@link IncomeKind}.
 *
 * **Sankey node layout:** each structural bar’s style/column/order is defined on the owning row via
 * `sankey.structuralNode` / `sankey.structuralNodes`. {@link SANKEY_NODE_LAYOUT} is derived; removing the last row
 * that defines a `kind` removes that node from the derived layout.
 */
import type { DeductionKind, IncomeKind, TaxSegment } from "~/lib/taxCalc.types";
import type {
  DisplayItem,
  DisplayItemConfig,
  DisplayItemFormat,
  TaxChartMetrics,
  TaxFormRow,
  TaxMetricComputedValue,
  TaxMetricLine,
} from "~/lib/taxForm.types";
import type { TaxCalculationInputs, TaxCalculationState, TaxPipelineSnapshot } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import type {
  DeductionCalculationResult,
  FederalLtcgTaxResult,
  FederalNiitResult,
  FederalOrdinaryTaxResult,
  IncomeAggregationResult,
  PayrollTaxResult,
  PretaxBenefitsResult,
  SelfEmploymentTaxResult,
  TakeHomeResult,
  TaxCreditsResult,
} from "~/lib/taxItemResult.types";
import {
  calculateBracketTax,
  calculateLtcgTax,
  DEDUCTION_KIND_CONFIGS,
  FEDERAL_CREDIT_CONFIGS,
  INCOME_KIND_CONFIGS,
  PRETAX_BENEFIT_CONFIGS,
  SELF_EMPLOYMENT_CONFIGS,
} from "~/lib/config/taxItems";
import type { PretaxBenefitConfig } from "~/lib/config/taxItems";
import type { ChartCategory } from "~/lib/config/taxItems";
import type { SankeyNodeKind } from "~/lib/config/taxItems";
import type { SankeyMetricAppendContext } from "~/lib/config/sankeyMetricAppendContext";
import type { SankeyPhaseId } from "~/lib/config/sankeyPhaseId";
export type { SankeyMetricAppendContext };
import { appendLtcgBracketSankey, appendOrdinaryBracketSankey } from "~/lib/taxCharts.sankeyPhaseBrackets";

/** Fold income sources into aggregation fields (`map` seeds zeros, `reduce` sums amounts). */
function aggregateIncomeFieldsFromSources(
  sources: TaxCalculationInputs["incomeSources"],
): Record<string, number> {
  return sources.reduce(
    (acc, src) => {
      const cfg = INCOME_KIND_CONFIGS.find((c) => c.id === src.kind);
      if (cfg) acc[cfg.aggregationField] += src.amount;
      return acc;
    },
    Object.fromEntries(INCOME_KIND_CONFIGS.map((c) => [c.aggregationField, 0])) as Record<string, number>,
  );
}

function incomeAggregationResultFromCi(
  ci: TaxCalculationInputs,
  aggregated: Record<string, number>,
): IncomeAggregationResult {
  const totalIncome = Object.values(aggregated).reduce((s, n) => s + n, 0);
  return {
    id: "income-aggregation",
    label: "Total Income",
    amount: totalIncome,
    category: "income",
    wageIncome: aggregated.wageIncome ?? 0,
    selfEmploymentIncome: aggregated.selfEmploymentIncome ?? 0,
    ordinaryIncome: aggregated.ordinaryIncome ?? 0,
    shortTermCapGains: aggregated.shortTermCapGains ?? 0,
    longTermCapGains: aggregated.longTermCapGains ?? 0,
    totalIncome,
  };
}

/** Map form {@link PretaxBenefitKind} strings (e.g. `preTax401kSpouse1`) to registry rows; short ids (`401k`) supported for legacy rows. */
function resolvePretaxBenefitConfigForKind(kind: string): PretaxBenefitConfig | undefined {
  if (kind === "traditionalIraSpouse1" || kind === "traditionalIraSpouse2") {
    return PRETAX_BENEFIT_CONFIGS.find((c) => c.id === "traditionalIra");
  }
  const kl = kind.toLowerCase();
  // Elective deferrals: 401(k), 403(b), 457(b) share modeling with the 401k bucket (combined deferral cap per spouse).
  if (kl.includes("401k") || kl.includes("403b") || kl.includes("457")) {
    return PRETAX_BENEFIT_CONFIGS.find((c) => c.id === "401k");
  }
  if (kl.includes("hsa")) {
    return PRETAX_BENEFIT_CONFIGS.find((c) => c.id === "hsa");
  }
  if (kind === "preTaxOther") {
    return PRETAX_BENEFIT_CONFIGS.find((c) => c.id === "other");
  }
  if (kl.includes("fsa") || kl.includes("commuter")) {
    return PRETAX_BENEFIT_CONFIGS.find((c) => c.id === "other");
  }
  return PRETAX_BENEFIT_CONFIGS.find((c) => c.id === kind);
}

function computePretaxBenefits(
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
  income: IncomeAggregationResult,
): PretaxBenefitsResult {
  const joint = inputs.filingStatus === "marriedJoint";
  const limits = config.pretaxLimits;

  const aggregated = inputs.pretaxBenefitSources.reduce(
    (acc, src) => {
      const cfg = resolvePretaxBenefitConfigForKind(src.kind);
      if (!cfg) return acc;
      const isSpouse2 = src.kind.toLowerCase().includes("spouse2");
      if (cfg.isSpouseSpecific) {
        acc[cfg.aggregationField][isSpouse2 ? "spouse2" : "spouse1"] += src.amount;
      } else {
        acc[cfg.aggregationField].spouse1 += src.amount;
      }
      return acc;
    },
    Object.fromEntries(
      PRETAX_BENEFIT_CONFIGS.map((cfg) => [cfg.aggregationField, { spouse1: 0, spouse2: 0 }]),
    ) as Record<string, { spouse1: number; spouse2: number }>,
  );

  const perCfgEffects = PRETAX_BENEFIT_CONFIGS.map((cfg) => {
    const agg = aggregated[cfg.aggregationField];
    const limit = cfg.limitKey ? limits[cfg.limitKey!] : cfg.limitFn ? cfg.limitFn(limits, joint) : undefined;
    const effective1 = limit !== undefined ? Math.min(agg.spouse1, limit) : agg.spouse1;
    const effective2 = cfg.isSpouseSpecific && limit !== undefined ? Math.min(agg.spouse2, limit) : agg.spouse2;
    const effective = effective1 + effective2;
    return { cfg, effective, effective1, effective2 };
  });

  const totalPretax = perCfgEffects
    .filter((r) => r.cfg.id !== "traditionalIra")
    .reduce((s, r) => s + r.effective, 0);
  const totalIra = perCfgEffects
    .filter((r) => r.cfg.id === "traditionalIra")
    .reduce((s, r) => s + r.effective, 0);

  const pick = (id: string) => perCfgEffects.find((r) => r.cfg.id === id);
  const k401 = pick("401k")?.effective ?? 0;
  const hsaT = pick("hsa")?.effective ?? 0;
  const otherT = pick("other")?.effective ?? 0;

  const wageIncome = income.wageIncome;
  const wagesAfterPretax = Math.max(0, wageIncome - totalPretax - totalIra);

  return {
    id: "pretax-benefits",
    label: "Pre-tax Benefits",
    amount: totalPretax,
    category: "pretax",
    "401k": k401,
    hsa: hsaT,
    other: otherT,
    traditionalIra: totalIra,
    wagesAfterPretax,
  };
}

function computeDeduction(inputs: TaxCalculationInputs, config: TaxYearConfig): DeductionCalculationResult {
  const standardDeduction = config.standardDeduction[inputs.filingStatus];

  const itemizedAggregated = inputs.itemizedDeductions.reduce(
    (acc, ded) => {
      const cfg = DEDUCTION_KIND_CONFIGS.find((c) => c.id === ded.kind);
      if (cfg) acc[cfg.aggregationField] += ded.amount;
      return acc;
    },
    Object.fromEntries(DEDUCTION_KIND_CONFIGS.map((c) => [c.aggregationField, 0])) as Record<string, number>,
  );

  const itemizedDeductions = Object.values(itemizedAggregated).reduce((s, n) => s + n, 0);

  const useItemized = inputs.useItemizedDeductions && itemizedDeductions > standardDeduction;
  const deductionAmount = useItemized ? itemizedDeductions : standardDeduction;

  return {
    id: "deduction-calculation",
    label: useItemized ? "Itemized Deductions" : "Standard Deduction",
    amount: deductionAmount,
    category: "deduction",
    kind: useItemized ? "itemized" : "standard",
    standardDeduction,
  };
}

function computeFederalOrdinary(
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
  income: IncomeAggregationResult,
  pretax: PretaxBenefitsResult,
  deduction: DeductionCalculationResult,
): FederalOrdinaryTaxResult {
  const wageIncome = income.wageIncome;
  const ordinaryIncome = income.ordinaryIncome;
  const shortTermCapGains = income.shortTermCapGains;
  const preTaxTotal = pretax.amount;
  const deductionAmount = deduction.amount;

  const ordinaryAfterPretax = wageIncome + ordinaryIncome + shortTermCapGains - preTaxTotal;
  const ordinaryTaxableIncome = Math.max(0, ordinaryAfterPretax - deductionAmount);

  const brackets = config.federalBrackets[inputs.filingStatus];
  const { tax: totalTax, segments } = calculateBracketTax(ordinaryTaxableIncome, brackets);

  const formattedSegments = segments.map((s) => ({
    rangeStart: s.rangeStart,
    rangeEnd: s.rangeEnd,
    incomeAmount: s.incomeAmount,
    taxAmount: s.taxAmount,
    marginalRate: s.rate,
  }));

  return {
    id: "federal-ordinary-tax",
    label: "Federal Ordinary Income Tax",
    amount: totalTax,
    category: "tax",
    ordinaryTaxableIncome,
    segments: formattedSegments,
  };
}

function computeFederalLtcgInner(
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
  income: IncomeAggregationResult,
  deduction: DeductionCalculationResult,
  federalOrdinary: FederalOrdinaryTaxResult,
): FederalLtcgTaxResult {
  const longTermCapGains = income.longTermCapGains;
  const deductionAmount = deduction.amount;
  const ordinaryTaxableIncome = federalOrdinary.ordinaryTaxableIncome;

  const remainingDeduction = Math.max(0, deductionAmount - ordinaryTaxableIncome);
  const longTermTaxableIncome = Math.max(0, longTermCapGains - remainingDeduction);

  const ltcgThresholds = config.longTermCapGains[inputs.filingStatus];
  const { tax: totalTax, segments } = calculateLtcgTax(longTermTaxableIncome, ltcgThresholds, ordinaryTaxableIncome);

  return {
    id: "federal-ltcg-tax",
    label: "Federal Long-Term Capital Gains Tax",
    amount: totalTax,
    category: "tax",
    longTermTaxableIncome,
    segments,
  };
}

function computeNiit(
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
  income: IncomeAggregationResult,
  federalLtcg: FederalLtcgTaxResult,
): FederalNiitResult {
  const wageIncome = income.wageIncome;
  const ordinaryIncome = income.ordinaryIncome;
  const shortTermCapGains = income.shortTermCapGains;
  const longTermTaxableIncome = federalLtcg.longTermTaxableIncome;

  const magi = wageIncome + ordinaryIncome + shortTermCapGains + income.longTermCapGains;
  const netInvestmentIncome = shortTermCapGains + longTermTaxableIncome;
  const threshold = config.niit.magiThreshold[inputs.filingStatus];

  const magiOverThreshold = Math.max(0, magi - threshold);
  const niitAmount =
    netInvestmentIncome > 0 && magiOverThreshold > 0 ? Math.min(netInvestmentIncome, magiOverThreshold) * config.niit.rate : 0;

  return {
    id: "federal-niit",
    label: "Federal Net Investment Income Tax",
    amount: niitAmount,
    category: "tax",
    netInvestmentIncome,
  };
}

function computeTaxCreditsInner(
  inputs: TaxCalculationInputs,
  ordinaryTax: FederalOrdinaryTaxResult,
  ltcgTax: FederalLtcgTaxResult,
  niit: FederalNiitResult,
): TaxCreditsResult {
  const totalTaxLiability = ordinaryTax.amount + ltcgTax.amount + niit.amount;

  const creditsAggregated = inputs.federalTaxCredits.reduce(
    (acc, credit) => {
      const cfg = FEDERAL_CREDIT_CONFIGS.find((c) => c.id === credit.kind);
      if (cfg) acc[cfg.aggregationField] += credit.amount;
      return acc;
    },
    Object.fromEntries(FEDERAL_CREDIT_CONFIGS.map((c) => [c.aggregationField, 0])) as Record<string, number>,
  );

  const creditsEntered = Object.values(creditsAggregated).reduce((s, n) => s + n, 0);

  const creditsApplied = Math.min(creditsEntered, totalTaxLiability);
  const federalIncomeTaxAfterCredits = Math.max(0, totalTaxLiability - creditsApplied);

  return {
    id: "tax-credits",
    label: "Federal Tax Credits",
    amount: creditsApplied,
    category: "credit",
    creditsEntered,
    creditsApplied,
    totalTaxLiability,
    federalIncomeTaxAfterCredits,
    childTaxCredit: creditsAggregated.childTaxCredit ?? 0,
    educationCredits: creditsAggregated.educationCredits ?? 0,
    retirementSavings: creditsAggregated.retirementSavings ?? 0,
    other: creditsAggregated.other ?? 0,
  };
}

function computePayrollInner(
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
  income: IncomeAggregationResult,
  pretax: PretaxBenefitsResult,
): PayrollTaxResult {
  const wageIncome = income.wageIncome;
  const preTaxTotal = pretax.amount;
  const wagesForPayroll = Math.max(0, wageIncome - preTaxTotal);

  const wageBase = config.payroll.socialSecurityWageBase;
  const socialSecurityTax = Math.min(wagesForPayroll, wageBase) * config.payroll.socialSecurityRate;
  const medicareTaxBase = wagesForPayroll * config.payroll.medicareRate;
  const additionalMedicareThreshold = config.payroll.additionalMedicareThreshold[inputs.filingStatus];
  const additionalMedicare =
    wagesForPayroll > additionalMedicareThreshold ? (wagesForPayroll - additionalMedicareThreshold) * config.payroll.additionalMedicareRate : 0;
  const medicareTax = medicareTaxBase + additionalMedicare;

  const totalPayrollTax = socialSecurityTax + medicareTax;

  return {
    id: "payroll-tax",
    label: "Payroll Taxes",
    amount: totalPayrollTax,
    category: "tax",
    socialSecurityTax,
    medicareTax,
  };
}

function computeSelfEmploymentInner(inputs: TaxCalculationInputs, config: TaxYearConfig): SelfEmploymentTaxResult {
  const seConfig = SELF_EMPLOYMENT_CONFIGS[0];

  const selfEmploymentIncome = inputs.incomeSources.filter((s) => s.kind === "selfEmployment").reduce((sum, s) => sum + s.amount, 0);

  const netEarnings = selfEmploymentIncome * seConfig.netEarningsRate;

  const wageBase = config.payroll.socialSecurityWageBase;
  const ssRate = config.payroll.socialSecurityRate * seConfig.ssMultiplier;
  const medicareRate = config.payroll.medicareRate * seConfig.ssMultiplier;
  const additionalMedicareRate = config.payroll.additionalMedicareRate * seConfig.ssMultiplier;

  const additionalThreshold = config.payroll.additionalMedicareThreshold[inputs.filingStatus];

  const seSocialSecurityTax = Math.min(netEarnings, wageBase) * ssRate;
  const seMedicareTax = netEarnings * medicareRate;
  const additionalMedicare = netEarnings > additionalThreshold ? (netEarnings - additionalThreshold) * additionalMedicareRate : 0;
  const selfEmploymentTax = seSocialSecurityTax + seMedicareTax + additionalMedicare;

  return {
    id: "self-employment-tax",
    label: "Self-Employment Tax",
    amount: selfEmploymentTax,
    category: "tax",
  };
}

function computeTakeHomeInner(
  inputs: TaxCalculationInputs,
  income: IncomeAggregationResult,
  pretax: PretaxBenefitsResult,
  ordinaryTax: FederalOrdinaryTaxResult,
  ltcgTax: FederalLtcgTaxResult,
  niit: FederalNiitResult,
  credits: TaxCreditsResult,
  payrollTax: PayrollTaxResult,
  selfEmploymentTaxResult: SelfEmploymentTaxResult,
): TakeHomeResult {
  const totalIncome = income.amount;
  const preTaxTotal = pretax.amount;
  const pretaxIra = pretax.traditionalIra;
  const federalTax = ordinaryTax.amount + ltcgTax.amount + niit.amount - credits.amount;
  const payroll = payrollTax.amount;
  const selfEmploymentTax = selfEmploymentTaxResult.amount;

  const wagesAfterPretax = Math.max(0, totalIncome - preTaxTotal - pretaxIra);
  const takeHome = Math.max(0, totalIncome - preTaxTotal - federalTax - payroll - selfEmploymentTax - pretaxIra);

  const effectiveRateDenominator = Math.max(0, totalIncome - preTaxTotal - pretaxIra);
  const totalTax = federalTax + payroll + selfEmploymentTax;
  const effectiveRate = effectiveRateDenominator > 0 ? totalTax / effectiveRateDenominator : 0;
  const segs = ordinaryTax.segments;
  const marginalFederalRate = segs.length ? (segs[segs.length - 1]?.marginalRate ?? 0) : 0;

  return {
    id: "take-home-calculation",
    label: "Take-Home Pay",
    amount: takeHome,
    category: "income",
    effectiveRate,
    marginalFederalRate,
  };
}

/** Mutable pipeline-shaped state filled only from registry `compute` bodies (via `accrete*` helpers below). */
export type ChartPipelineAccretion = Partial<TaxPipelineSnapshot>;

export type ChartMetricComputeContext = {
  formRows: TaxFormRow[];
  inputs: TaxCalculationInputs;
  config: TaxYearConfig;
  /** Filled incrementally as registry `compute` functions run (via `accrete*` helpers). */
  accreted: ChartPipelineAccretion;
};

function accreteIncome(ctx: ChartMetricComputeContext): IncomeAggregationResult {
  if (!ctx.accreted.income) {
    const aggregated = aggregateIncomeFieldsFromSources(ctx.inputs.incomeSources);
    ctx.accreted.income = incomeAggregationResultFromCi(ctx.inputs, aggregated);
  }
  return ctx.accreted.income!;
}

function accretePretax(ctx: ChartMetricComputeContext): PretaxBenefitsResult {
  const income = accreteIncome(ctx);
  if (!ctx.accreted.pretax) {
    ctx.accreted.pretax = computePretaxBenefits(ctx.inputs, ctx.config, income);
  }
  return ctx.accreted.pretax!;
}

function accreteDeduction(ctx: ChartMetricComputeContext): DeductionCalculationResult {
  if (!ctx.accreted.deduction) {
    ctx.accreted.deduction = computeDeduction(ctx.inputs, ctx.config);
  }
  return ctx.accreted.deduction!;
}

function accreteFederalOrdinary(ctx: ChartMetricComputeContext): FederalOrdinaryTaxResult {
  if (!ctx.accreted.federalOrdinary) {
    ctx.accreted.federalOrdinary = computeFederalOrdinary(
      ctx.inputs,
      ctx.config,
      accreteIncome(ctx),
      accretePretax(ctx),
      accreteDeduction(ctx),
    );
  }
  return ctx.accreted.federalOrdinary!;
}

function accreteFederalLtcg(ctx: ChartMetricComputeContext): FederalLtcgTaxResult {
  if (!ctx.accreted.federalLtcg) {
    ctx.accreted.federalLtcg = computeFederalLtcgInner(
      ctx.inputs,
      ctx.config,
      accreteIncome(ctx),
      accreteDeduction(ctx),
      accreteFederalOrdinary(ctx),
    );
  }
  return ctx.accreted.federalLtcg!;
}

function accreteNiit(ctx: ChartMetricComputeContext): FederalNiitResult {
  if (!ctx.accreted.niit) {
    ctx.accreted.niit = computeNiit(ctx.inputs, ctx.config, accreteIncome(ctx), accreteFederalLtcg(ctx));
  }
  return ctx.accreted.niit!;
}

function accreteTaxCredits(ctx: ChartMetricComputeContext): TaxCreditsResult {
  if (!ctx.accreted.taxCredits) {
    ctx.accreted.taxCredits = computeTaxCreditsInner(
      ctx.inputs,
      accreteFederalOrdinary(ctx),
      accreteFederalLtcg(ctx),
      accreteNiit(ctx),
    );
  }
  return ctx.accreted.taxCredits!;
}

function accretePayroll(ctx: ChartMetricComputeContext): PayrollTaxResult {
  if (!ctx.accreted.payroll) {
    ctx.accreted.payroll = computePayrollInner(ctx.inputs, ctx.config, accreteIncome(ctx), accretePretax(ctx));
  }
  return ctx.accreted.payroll!;
}

function accreteSelfEmployment(ctx: ChartMetricComputeContext): SelfEmploymentTaxResult {
  if (!ctx.accreted.selfEmployment) {
    ctx.accreted.selfEmployment = computeSelfEmploymentInner(ctx.inputs, ctx.config);
  }
  return ctx.accreted.selfEmployment!;
}

function accreteTakeHome(ctx: ChartMetricComputeContext): TakeHomeResult {
  if (!ctx.accreted.takeHome) {
    ctx.accreted.takeHome = computeTakeHomeInner(
      ctx.inputs,
      accreteIncome(ctx),
      accretePretax(ctx),
      accreteFederalOrdinary(ctx),
      accreteFederalLtcg(ctx),
      accreteNiit(ctx),
      accreteTaxCredits(ctx),
      accretePayroll(ctx),
      accreteSelfEmployment(ctx),
    );
  }
  return ctx.accreted.takeHome!;
}

/**
 * One Sankey structural `kind` (see ChartNode.kind): position, column, fills. Attached to the registry row that owns
 * that bar; first row in {@link CHART_REGISTRY} wins if the same `kind` appears twice.
 */
export type SankeyNodeLayoutEntry = {
  kind: string;
  /** Vertical sibling sort (lower = higher on chart). */
  order: number;
  /** Semantic column index before proportional mapping to d3 layers. */
  column: number;
  fill: string;
  linkStroke: string;
  fillBenefitAccounting?: string;
  linkStrokeBenefitAccounting?: string;
};

export type ChartMetricSankeyHint = {
  sankeyNodeKind?: SankeyNodeKind;
  chartCategory?: ChartCategory;
  showWhen?: (ctx: ChartMetricComputeContext) => boolean;
  /**
   * When this row’s `visualizationSourceId` is an {@link IncomeKind}, vertical position of that income on the Sankey
   * income column (lower = higher on chart). Drives {@link INCOME_KIND_CHART_ORDER_BY_KIND}.
   */
  incomeKindVerticalOrder?: number;
  /** Primary structural node for this metric’s Sankey `kind` (merge with {@link structuralNodes} when collecting). */
  structuralNode?: SankeyNodeLayoutEntry;
  /** Additional structural nodes when this metric owns more than one bar (e.g. ordinary taxable + payroll strip). */
  structuralNodes?: readonly SankeyNodeLayoutEntry[];
  /** When set, {@link sankeyRegistryRunner.runSankeyRegistryAppendersForPhase} invokes `append` during this Sankey build phase. */
  phase?: SankeyPhaseId;
  /**
   * Contributes Sankey nodes/links for this row. Many metrics have no `append` (e.g. gross income uses one node per
   * form row, not one per metric); those phases stay in `taxCharts.sankeyPhase*` until migrated.
   */
  append?: (ctx: SankeyMetricAppendContext) => void;
};

export type ChartMetricMekkoHint = {
  role: "deduction" | "ordinaryBracket" | "ltcgBracket" | "none";
  usesSegments?: boolean;
};

export type ChartMetricValueKind = "number" | "segments" | "deductionKind";

/** Tax Summary column grouping (aligned with {@link MetricConfig} in taxVisualization.config). */
export type ChartMetricSummaryCategory =
  | "income"
  | "pretax"
  | "deduction"
  | "tax"
  | "credits"
  | "takehome"
  | "rate";

export type ChartMetricSummaryHint = {
  /** Row id in Tax Summary tables and baseline keys. */
  summaryId: string;
  label: string;
  category: ChartMetricSummaryCategory;
  displayOrder: number;
  format?: "currency" | "percent" | "number";
  highlight?: boolean;
  showWhen?: (m: TaxChartMetrics) => boolean;
};

function incomeSummary(incomeKindId: string, displayOrder: number): ChartMetricSummaryHint {
  const cfg = INCOME_KIND_CONFIGS.find((c) => c.id === incomeKindId)!;
  return { summaryId: cfg.id, label: cfg.label, category: "income", displayOrder };
}

function pretaxSummaryRow(cfg: PretaxBenefitConfig, displayOrder: number): ChartMetricSummaryHint {
  const summaryId =
    cfg.id === "401k"
      ? "preTax401k"
      : cfg.id === "hsa"
        ? "preTaxHsa"
        : cfg.id === "other"
          ? "preTaxOther"
          : cfg.id === "traditionalIra"
            ? "traditionalIra"
            : cfg.id;
  return { summaryId, label: cfg.label, category: "pretax", displayOrder };
}

function federalCreditSummary(cfg: (typeof FEDERAL_CREDIT_CONFIGS)[number], displayOrder: number): ChartMetricSummaryHint {
  return {
    summaryId: `${cfg.aggregationField}Credit`,
    label: cfg.label,
    category: "credits",
    displayOrder,
  };
}



/** Builds the context passed to each registry `compute`; tax math runs only inside those computes. */
export function buildChartMetricComputeContext(
  formRows: TaxFormRow[],
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
): ChartMetricComputeContext {
  return {
    formRows,
    inputs,
    config,
    accreted: {},
  };
}

/** Row in the detailed income/tax breakdown panel; lives on registry entries as {@link ChartRegistryEntry.detailedDisplay}. */
export type ChartMetricDetailedDisplayHint = {
  order: number;
  type: string;
  category: "income" | "pretax" | "deduction" | "tax" | "credit" | "summary";
  format?: "currency" | "percent" | "number";
  label?: string;
  tooltip?: string;
  color?: string;
  highlight?: boolean;
};

export type ChartRegistryEntry = {
  metricsKey: keyof TaxChartMetrics;
  valueKind: ChartMetricValueKind;
  /** Optional display id → chart key (see VISUALIZATION_METRIC_ID_TO_CHART_KEY). */
  visualizationSourceId?: string;
  /** If set, this metric appears in the default Tax Summary (see `buildDefaultMetricsConfig` in taxVisualization.config). */
  summary?: ChartMetricSummaryHint;
  /** If set, this metric appears in the detailed breakdown list (see `buildDisplayItemsConfig` in chartDisplayItems). */
  detailedDisplay?: ChartMetricDetailedDisplayHint;
  sankey?: ChartMetricSankeyHint;
  mekko?: ChartMetricMekkoHint;
  compute: (ctx: ChartMetricComputeContext) => number | TaxSegment[] | DeductionKind;
};

/** @deprecated Use {@link ChartRegistryEntry} */
export type ChartMetricRegistryEntry = ChartRegistryEntry;

/**
 * Ordered: single source for pipeline metrics, Sankey structural nodes, resolve order, and serialization.
 *
 * Each `compute` calls `accrete*` helpers and reads {@link ChartMetricComputeContext.accreted}.
 */
export const CHART_REGISTRY: readonly ChartRegistryEntry[] = [
  {
    metricsKey: "totalIncome",
    valueKind: "number",
    visualizationSourceId: "total-income",
    sankey: {
      structuralNode: {
        kind: "incomeSource",
        order: 0,
        column: 0,
        fill: "var(--sankey-node-income)",
        linkStroke: "var(--sankey-link)",
      },
    },
    summary: { summaryId: "total-income", label: "Total Income", category: "income", displayOrder: 6 },
    detailedDisplay: {
      order: 105,
      type: "total-income",
      category: "income",
      label: "Total Income",
      tooltip: "Gross income from all sources",
      color: "#166534",
    },
    compute: (ctx) => accreteIncome(ctx).totalIncome,
  },
  {
    metricsKey: "wageIncome",
    valueKind: "number",
    visualizationSourceId: "wages",
    sankey: { incomeKindVerticalOrder: 3 },
    summary: incomeSummary("wages", 1),
    detailedDisplay: { order: 100, type: "wages", category: "income" },
    compute: (ctx) => accreteIncome(ctx).wageIncome,
  },
  {
    metricsKey: "selfEmploymentIncome",
    valueKind: "number",
    visualizationSourceId: "selfEmployment",
    sankey: { incomeKindVerticalOrder: 2 },
    summary: incomeSummary("selfEmployment", 2),
    detailedDisplay: { order: 101, type: "selfemployment", category: "income" },
    compute: (ctx) => accreteIncome(ctx).selfEmploymentIncome,
  },
  {
    metricsKey: "ordinaryGrossIncome",
    valueKind: "number",
    visualizationSourceId: "ordinary",
    sankey: { incomeKindVerticalOrder: 4 },
    summary: incomeSummary("ordinary", 3),
    detailedDisplay: { order: 102, type: "ordinary", category: "income" },
    compute: (ctx) => {
      const i = accreteIncome(ctx);
      return i.ordinaryIncome + i.shortTermCapGains;
    },
  },
  {
    metricsKey: "shortTermCapGainsGrossIncome",
    valueKind: "number",
    visualizationSourceId: "shortTermCapGains",
    sankey: { incomeKindVerticalOrder: 1 },
    summary: incomeSummary("shortTermCapGains", 4),
    detailedDisplay: { order: 103, type: "shorttermcapgains", category: "income" },
    compute: (ctx) => accreteIncome(ctx).shortTermCapGains,
  },
  {
    metricsKey: "longTermCapitalGainsGrossIncome",
    valueKind: "number",
    visualizationSourceId: "longTermCapGains",
    sankey: {
      incomeKindVerticalOrder: 0,
      structuralNode: {
        kind: "ltcgDeductionShield",
        order: 1,
        column: 1,
        fill: "var(--sankey-node-ltcg)",
        linkStroke: "var(--sankey-link)",
      },
    },
    summary: incomeSummary("longTermCapGains", 5),
    detailedDisplay: { order: 104, type: "longtermcapgains", category: "income" },
    compute: (ctx) => accreteIncome(ctx).longTermCapGains,
  },
  {
    metricsKey: "preTax401k",
    valueKind: "number",
    visualizationSourceId: "preTax401k",
    sankey: {
      structuralNode: {
        kind: "deferredSink",
        order: 16,
        /** Past pretax bars + shield so d3-sankey layers stay strictly income → pretax → shield → deferred (not same layer as {@link preTaxTotal} pretaxContribution). */
        column: 4,
        fill: "var(--sankey-node-deferred)",
        linkStroke: "var(--sankey-link-deferred)",
      },
    },
    summary: pretaxSummaryRow(PRETAX_BENEFIT_CONFIGS[0], 7),
    detailedDisplay: { order: 106, type: "401k", category: "pretax" },
    compute: (ctx) => accretePretax(ctx)["401k"],
  },
  {
    metricsKey: "preTaxHsa",
    valueKind: "number",
    visualizationSourceId: "preTaxHsa",
    summary: pretaxSummaryRow(PRETAX_BENEFIT_CONFIGS[1], 8),
    detailedDisplay: { order: 107, type: "hsa", category: "pretax" },
    compute: (ctx) => accretePretax(ctx).hsa,
  },
  {
    metricsKey: "preTaxOther",
    valueKind: "number",
    visualizationSourceId: "preTaxOther",
    summary: pretaxSummaryRow(PRETAX_BENEFIT_CONFIGS[3], 10),
    detailedDisplay: { order: 109, type: "other", category: "pretax" },
    compute: (ctx) => accretePretax(ctx).other,
  },
  {
    metricsKey: "preTaxTotal",
    valueKind: "number",
    visualizationSourceId: "preTaxTotal",
    sankey: {
      structuralNode: {
        kind: "pretaxContribution",
        order: 6,
        /** Same semantic column as ordinary taxable / standard deduction (second strip from income), not bracket column. */
        column: 1,
        fill: "var(--sankey-node-keep)",
        linkStroke: "var(--sankey-link)",
      },
    },
    detailedDisplay: {
      order: 110,
      type: "total-pretax",
      category: "pretax",
      label: "Total Pre-tax",
      tooltip: "Total pre-tax deductions",
      color: "#7e22ce",
    },
    compute: (ctx) => accretePretax(ctx).amount,
  },
  {
    metricsKey: "traditionalIra",
    valueKind: "number",
    visualizationSourceId: "traditionalIra",
    summary: pretaxSummaryRow(PRETAX_BENEFIT_CONFIGS[2], 9),
    detailedDisplay: { order: 108, type: "traditional-ira", category: "pretax" },
    compute: (ctx) => accretePretax(ctx).traditionalIra,
  },
  {
    metricsKey: "wagesAfterPretax",
    valueKind: "number",
    visualizationSourceId: "wages-after-pretax",
    sankey: {
      structuralNode: {
        kind: "deductionBenefitSink",
        order: 11,
        column: 1,
        fill: "var(--sankey-node-keep)",
        linkStroke: "var(--sankey-link-keep)",
        fillBenefitAccounting: "var(--sankey-node-deferred)",
        linkStrokeBenefitAccounting: "var(--sankey-link-deferred)",
      },
    },
    summary: {
      summaryId: "wages-after-pretax",
      label: "Wages After Pre-tax",
      category: "pretax",
      displayOrder: 11,
    },
    detailedDisplay: {
      order: 111,
      type: "wages-after-pretax",
      category: "pretax",
      tooltip: "Wages after pre-tax deductions",
      color: "#9333ea",
    },
    compute: (ctx) => accretePretax(ctx).wagesAfterPretax,
  },
  // {
  //   metricsKey: "deductionKind",
  //   valueKind: "deductionKind",
  //   compute: (ctx) => accreteDeduction(ctx).kind,
  // },
  {
    metricsKey: "standardDeduction",
    valueKind: "number",
    visualizationSourceId: "standard-deduction",
    sankey: {
      structuralNode: {
        kind: "standardDeduction",
        order: 4,
        column: 1,
        fill: "var(--sankey-node-2)",
        linkStroke: "var(--sankey-link)",
      },
    },
    summary: { summaryId: "standard-deduction", label: "Standard Deduction", category: "deduction", displayOrder: 12 },
    detailedDisplay: { order: 112, type: "standard-deduction", category: "deduction" },
    compute: (ctx) => accreteDeduction(ctx).standardDeduction,
  },
  {
    metricsKey: "deductionAmount",
    valueKind: "number",
    visualizationSourceId: "deduction-amount",
    sankey: {
      structuralNode: {
        kind: "deduction",
        order: 5,
        column: 1,
        fill: "var(--sankey-node-2)",
        linkStroke: "var(--sankey-link)",
      },
    },
    mekko: { role: "deduction", usesSegments: false },
    summary: { summaryId: "deduction-amount", label: "Deduction Used", category: "deduction", displayOrder: 13 },
    detailedDisplay: {
      order: 113,
      type: "deduction-used",
      category: "deduction",
      tooltip: "Higher of standard or itemized",
      color: "#d97706",
    },
    compute: (ctx) => accreteDeduction(ctx).amount,
  },
  {
    metricsKey: "deductionAllocatedToOrdinary",
    valueKind: "number",
    compute: () => 0,
  },
  {
    metricsKey: "deductionAllocatedToLongTermGross",
    valueKind: "number",
    compute: () => 0,
  },
  {
    metricsKey: "ordinaryTaxableIncome",
    valueKind: "number",
    visualizationSourceId: "ordinary-taxable-income",
    sankey: {
      structuralNodes: [
        {
          kind: "ordinaryTaxableIncome",
          order: 3,
          column: 1,
          fill: "var(--sankey-node-3)",
          linkStroke: "var(--sankey-link)",
        },
        {
          kind: "payrollOrdinaryStrip",
          order: 7,
          column: 3,
          fill: "var(--sankey-node-deferred)",
          linkStroke: "var(--sankey-link-deferred)",
        },
      ],
    },
    summary: { summaryId: "ordinary-taxable-income", label: "Ordinary Taxable", category: "income", displayOrder: 14 },
    detailedDisplay: {
      order: 114,
      type: "ordinary-taxable-income",
      category: "tax",
      label: "Ordinary Taxable Income",
    },
    compute: (ctx) => accreteFederalOrdinary(ctx).ordinaryTaxableIncome,
  },
  {
    metricsKey: "longTermTaxableIncome",
    valueKind: "number",
    visualizationSourceId: "long-term-taxable-income",
    sankey: {
      structuralNode: {
        kind: "longTermTaxableIncome",
        order: 2,
        column: 1,
        fill: "var(--sankey-node-ltcg)",
        linkStroke: "var(--sankey-link)",
      },
    },
    summary: { summaryId: "long-term-taxable-income", label: "LTCG Taxable", category: "income", displayOrder: 15 },
    detailedDisplay: {
      order: 115,
      type: "ltcg-taxable-income",
      category: "tax",
      label: "LTCG Taxable Income",
    },
    compute: (ctx) => accreteFederalLtcg(ctx).longTermTaxableIncome,
  },
  {
    metricsKey: "taxableIncome",
    valueKind: "number",
    sankey: {
      structuralNode: {
        kind: "deductionShield",
        order: 10,
        /** One step right of pretax middle bars so shield is not the same layer as {@link preTaxTotal} pretaxContribution. */
        column: 3,
        fill: "var(--sankey-node-5)",
        linkStroke: "var(--sankey-link)",
      },
    },
    compute: (ctx) =>
      accreteFederalOrdinary(ctx).ordinaryTaxableIncome + accreteFederalLtcg(ctx).longTermTaxableIncome,
  },
  {
    metricsKey: "ordinaryFederalSegments",
    valueKind: "segments",
    sankey: {
      sankeyNodeKind: "ordinaryBracket",
      chartCategory: "tax",
      phase: "brackets",
      append: appendOrdinaryBracketSankey,
      structuralNode: {
        kind: "ordinaryBracket",
        order: 9,
        column: 3,
        fill: "var(--sankey-node-4)",
        linkStroke: "var(--sankey-link)",
      },
    },
    mekko: { role: "ordinaryBracket", usesSegments: true },
    compute: (ctx) => accreteFederalOrdinary(ctx).segments,
  },
  {
    metricsKey: "longTermCapitalGainsSegments",
    valueKind: "segments",
    sankey: {
      sankeyNodeKind: "ltcgBracket",
      chartCategory: "tax",
      phase: "brackets",
      append: appendLtcgBracketSankey,
      structuralNode: {
        kind: "ltcgBracket",
        order: 8,
        column: 3,
        fill: "var(--sankey-node-ltcg)",
        linkStroke: "var(--sankey-link)",
      },
    },
    mekko: { role: "ltcgBracket", usesSegments: true },
    compute: (ctx) =>
      accreteFederalLtcg(ctx).segments.map((seg) => ({
        rangeStart: seg.rangeStart,
        rangeEnd: seg.rangeEnd,
        incomeAmount: seg.incomeAmount,
        taxAmount: seg.taxAmount,
        marginalRate: seg.rate,
      })),
  },
  {
    metricsKey: "federalOrdinaryIncomeTax",
    valueKind: "number",
    visualizationSourceId: "federal-ordinary-tax",
    sankey: { sankeyNodeKind: "ordinaryBracket", chartCategory: "tax" },
    summary: { summaryId: "federal-ordinary-tax", label: "Federal Ord. Tax", category: "tax", displayOrder: 16 },
    detailedDisplay: {
      order: 116,
      type: "federal-ordinary-tax",
      category: "tax",
      label: "Federal Ordinary Tax",
      tooltip: "Federal income tax on ordinary income",
    },
    compute: (ctx) => accreteFederalOrdinary(ctx).amount,
  },
  {
    metricsKey: "federalLongTermCapGainsTax",
    valueKind: "number",
    visualizationSourceId: "federal-ltcg-tax",
    sankey: { sankeyNodeKind: "ltcgBracket", chartCategory: "tax" },
    summary: { summaryId: "federal-ltcg-tax", label: "Federal LTCG Tax", category: "tax", displayOrder: 17 },
    detailedDisplay: {
      order: 117,
      type: "federal-ltcg-tax",
      category: "tax",
      label: "Federal LTCG Tax",
      tooltip: "Federal tax on long-term capital gains",
    },
    compute: (ctx) => accreteFederalLtcg(ctx).amount,
  },
  {
    metricsKey: "federalNetInvestmentIncomeTax",
    valueKind: "number",
    visualizationSourceId: "federal-niit",
    summary: { summaryId: "federal-niit", label: "Net Investment Income Tax", category: "tax", displayOrder: 18 },
    detailedDisplay: {
      order: 118,
      type: "federal-niit",
      category: "tax",
      label: "Net Investment Income Tax",
      tooltip: "3.8% NIIT on investment income",
    },
    compute: (ctx) => accreteNiit(ctx).amount,
  },
  {
    metricsKey: "netInvestmentIncome",
    valueKind: "number",
    compute: (ctx) => accreteNiit(ctx).netInvestmentIncome,
  },
  {
    metricsKey: "federalIncomeTaxBeforeCredits",
    valueKind: "number",
    visualizationSourceId: "federal-income-tax-before-credits",
    summary: {
      summaryId: "federal-income-tax-before-credits",
      label: "Fed Tax Before Credits",
      category: "tax",
      displayOrder: 20,
    },
    detailedDisplay: {
      order: 119,
      type: "federal-income-tax",
      category: "tax",
      label: "Federal Income Tax (before credits)",
      tooltip: "Total federal income tax before credits",
      color: "#dc2626",
    },
    compute: (ctx) => accreteTaxCredits(ctx).totalTaxLiability,
  },
  {
    metricsKey: "federalTaxCredits",
    valueKind: "number",
    compute: (ctx) => accreteTaxCredits(ctx).creditsEntered,
  },
  {
    metricsKey: "federalTaxCreditsApplied",
    valueKind: "number",
    sankey: {
      sankeyNodeKind: "federalCredits",
      chartCategory: "tax",
      structuralNode: {
        kind: "federalCredits",
        order: 14,
        column: 4,
        fill: "var(--sankey-node-credits)",
        linkStroke: "var(--sankey-link-credits)",
      },
    },
    compute: (ctx) => accreteTaxCredits(ctx).creditsApplied,
  },
  {
    metricsKey: "federalIncomeTax",
    valueKind: "number",
    visualizationSourceId: "federal-income-tax",
    sankey: {
      structuralNode: {
        kind: "taxesFederal",
        order: 13,
        column: 4,
        fill: "var(--sankey-node-6)",
        linkStroke: "var(--sankey-link-tax)",
      },
    },
    summary: { summaryId: "federal-income-tax", label: "Federal Income Tax", category: "tax", displayOrder: 19 },
    detailedDisplay: {
      order: 120,
      type: "federal-income-tax-after-credits",
      category: "tax",
      label: "Federal Income Tax",
      tooltip: "Federal income tax after credits",
      highlight: true,
      color: "#b91c1c",
    },
    compute: (ctx) => accreteTaxCredits(ctx).federalIncomeTaxAfterCredits,
  },
  {
    metricsKey: "payrollTax",
    valueKind: "number",
    visualizationSourceId: "payroll-tax",
    sankey: {
      sankeyNodeKind: "taxesPayroll",
      chartCategory: "tax",
      structuralNode: {
        kind: "taxesPayroll",
        order: 12,
        column: 4,
        fill: "var(--sankey-node-6)",
        linkStroke: "var(--sankey-link-tax)",
      },
    },
    summary: { summaryId: "payroll-tax", label: "Payroll Taxes", category: "tax", displayOrder: 28 },
    detailedDisplay: {
      order: 123,
      type: "payroll-tax",
      category: "tax",
      label: "Payroll Taxes",
      tooltip: "Social Security and Medicare",
      color: "#1d4ed8",
    },
    compute: (ctx) => accretePayroll(ctx).amount,
  },
  {
    metricsKey: "selfEmploymentTax",
    valueKind: "number",
    visualizationSourceId: "self-employment-tax",
    sankey: {
      sankeyNodeKind: "taxesPayroll",
      chartCategory: "tax",
    },
    summary: {
      summaryId: "self-employment-tax",
      label: "Self-Employment Tax",
      category: "tax",
      displayOrder: 27,
      showWhen: (m) => m.selfEmploymentTax > 0,
    },
    detailedDisplay: {
      order: 123,
      type: "self-employment-tax",
      category: "tax",
      label: "Self-Employment Tax",
      tooltip: "Social Security and Medicare on net self-employment earnings (SECA)",
      color: "#1d4ed8",
    },
    compute: (ctx) => accreteSelfEmployment(ctx).amount,
  },
  {
    metricsKey: "socialSecurityTax",
    valueKind: "number",
    visualizationSourceId: "social-security-tax",
    summary: { summaryId: "social-security-tax", label: "Social Security Tax", category: "tax", displayOrder: 25 },
    detailedDisplay: { order: 121, type: "social-security-tax", category: "tax", label: "Social Security Tax", color: "#3b82f6" },
    compute: (ctx) => accretePayroll(ctx).socialSecurityTax,
  },
  {
    metricsKey: "medicareTax",
    valueKind: "number",
    visualizationSourceId: "medicare-tax",
    summary: { summaryId: "medicare-tax", label: "Medicare Tax", category: "tax", displayOrder: 26 },
    detailedDisplay: { order: 122, type: "medicare-tax", category: "tax", label: "Medicare Tax", color: "#3b82f6" },
    compute: (ctx) => accretePayroll(ctx).medicareTax,
  },
  {
    metricsKey: "takeHomePay",
    valueKind: "number",
    visualizationSourceId: "take-home-pay",
    sankey: {
      sankeyNodeKind: "keep",
      chartCategory: "keep",
      structuralNode: {
        kind: "keep",
        order: 15,
        column: 4,
        fill: "var(--sankey-node-keep)",
        linkStroke: "var(--sankey-link-keep)",
      },
    },
    summary: {
      summaryId: "take-home-pay",
      label: "Take-Home Pay",
      category: "takehome",
      displayOrder: 29,
      highlight: true,
    },
    detailedDisplay: {
      order: 128,
      type: "take-home-pay",
      category: "summary",
      label: "Take-Home Pay",
      tooltip: "Income after all taxes and deductions",
      highlight: true,
    },
    compute: (ctx) => accreteTakeHome(ctx).amount,
  },
  {
    metricsKey: "effectiveTaxRate",
    valueKind: "number",
    visualizationSourceId: "effective-rate",
    summary: {
      summaryId: "effective-rate",
      label: "Effective Tax Rate",
      category: "rate",
      displayOrder: 30,
      format: "percent",
      highlight: true,
    },
    detailedDisplay: {
      order: 129,
      type: "effective-tax-rate",
      category: "summary",
      label: "Effective Tax Rate",
      format: "percent",
      tooltip: "Total tax / taxable income",
      highlight: true,
      color: "#0f766e",
    },
    compute: (ctx) => accreteTakeHome(ctx).effectiveRate,
  },
  {
    metricsKey: "childTaxCredit",
    valueKind: "number",
    summary: federalCreditSummary(FEDERAL_CREDIT_CONFIGS[0], 21),
    detailedDisplay: {
      order: 124,
      type: "childTaxCredit-credit",
      category: "credit",
      label: FEDERAL_CREDIT_CONFIGS[0]!.label,
      color: "#14b8a6",
    },
    compute: (ctx) => accreteTaxCredits(ctx).childTaxCredit,
  },
  {
    metricsKey: "educationCredits",
    valueKind: "number",
    summary: federalCreditSummary(FEDERAL_CREDIT_CONFIGS[1], 22),
    detailedDisplay: {
      order: 125,
      type: "educationCredits-credit",
      category: "credit",
      label: FEDERAL_CREDIT_CONFIGS[1]!.label,
      color: "#14b8a6",
    },
    compute: (ctx) => accreteTaxCredits(ctx).educationCredits,
  },
  {
    metricsKey: "retirementSavings",
    valueKind: "number",
    summary: federalCreditSummary(FEDERAL_CREDIT_CONFIGS[2], 23),
    detailedDisplay: {
      order: 126,
      type: "retirementSavingsContributions-credit",
      category: "credit",
      label: FEDERAL_CREDIT_CONFIGS[2]!.label,
      color: "#14b8a6",
    },
    compute: (ctx) => accreteTaxCredits(ctx).retirementSavings,
  },
  {
    metricsKey: "federalCreditOther",
    valueKind: "number",
    summary: federalCreditSummary(FEDERAL_CREDIT_CONFIGS[3], 24),
    detailedDisplay: {
      order: 127,
      type: "other-credit",
      category: "credit",
      label: FEDERAL_CREDIT_CONFIGS[3]!.label,
      color: "#14b8a6",
    },
    compute: (ctx) => accreteTaxCredits(ctx).other,
  },
  {
    metricsKey: "marginalFederalRate",
    valueKind: "number",
    summary: {
      summaryId: "marginal-rate",
      label: "Marginal Rate",
      category: "rate",
      displayOrder: 31,
      format: "percent",
    },
    detailedDisplay: {
      order: 130,
      type: "marginal-tax-rate",
      category: "summary",
      label: "Marginal Tax Rate",
      format: "percent",
      tooltip: "Highest federal ordinary bracket",
      color: "#115e59",
    },
    compute: (ctx) => accreteTakeHome(ctx).marginalFederalRate,
  },
];

/** Sankey income-column order: registry rows with `sankey.incomeKindVerticalOrder` and income `visualizationSourceId`. */
function buildIncomeKindSankeyOrderFromRegistry(): readonly { kind: IncomeKind; order: number }[] {
  const rows: { kind: IncomeKind; order: number }[] = [];
  for (const e of CHART_REGISTRY) {
    const o = e.sankey?.incomeKindVerticalOrder;
    if (e.visualizationSourceId != null && typeof o === "number") {
      rows.push({ kind: e.visualizationSourceId as IncomeKind, order: o });
    }
  }
  rows.sort((a, b) => a.order - b.order);
  return rows;
}

export const INCOME_KIND_SANKEY_ORDER = buildIncomeKindSankeyOrderFromRegistry();

export const INCOME_KIND_CHART_ORDER_BY_KIND = Object.fromEntries(
  INCOME_KIND_SANKEY_ORDER.map((k) => [k.kind, k.order]),
) as Record<IncomeKind, number>;

/** Element shape of {@link INCOME_KIND_SANKEY_ORDER}. */
export type SankeyOrderKind = {
  kind: IncomeKind | string;
  order: number;
};

function collectStructuralNodesFromRegistry(registry: readonly ChartRegistryEntry[]): SankeyNodeLayoutEntry[] {
  const byKind = new Map<string, SankeyNodeLayoutEntry>();
  for (const e of registry) {
    const s = e.sankey;
    if (!s) continue;
    const nodes: SankeyNodeLayoutEntry[] = [];
    if (s.structuralNode) nodes.push(s.structuralNode);
    if (s.structuralNodes) nodes.push(...s.structuralNodes);
    for (const n of nodes) {
      if (!byKind.has(n.kind)) {
        byKind.set(n.kind, n);
      }
    }
  }
  return [...byKind.values()].sort((a, b) => a.order - b.order);
}

/** Derived from `sankey.structuralNode(s)` on {@link CHART_REGISTRY} rows. */
export const SANKEY_NODE_LAYOUT: readonly SankeyNodeLayoutEntry[] = collectStructuralNodesFromRegistry(CHART_REGISTRY);

/** Fallback when a node kind is not listed (e.g. future kinds). */
export const SANKEY_NODE_FILL_DEFAULT = "var(--sankey-node-7)";
export const SANKEY_LINK_STROKE_DEFAULT = "var(--sankey-link)";

/** Highest semantic column index in {@link SANKEY_NODE_LAYOUT} (inclusive). */
export const SANKEY_VISUAL_SEMANTIC_MAX = Math.max(0, ...SANKEY_NODE_LAYOUT.map((e) => e.column));

export const SANKEY_NODE_KIND_CHART_ORDER: Record<string, number> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map((k) => [k.kind, k.order]),
);

export const SANKEY_VISUAL_COLUMN_BY_KIND: Record<string, number> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map((k) => [k.kind, k.column]),
);

export const SANKEY_NODE_STYLE_BY_KIND: Record<string, SankeyNodeLayoutEntry> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map((e) => [e.kind, e]),
);

/** Keys in resolve / `TAX_CHART_METRICS_KEYS` order. */
export const TAX_CHART_METRICS_KEYS_FROM_REGISTRY = CHART_REGISTRY.map((e) => e.metricsKey);

export const SEGMENT_METRIC_KEYS_FROM_REGISTRY = new Set(
  CHART_REGISTRY.filter((e) => e.valueKind === "segments").map((e) => e.metricsKey),
);

/** Pipeline serialization order (matches registry array order). */
export const PIPELINE_COMPUTED_ROW_ORDER_FULL_FROM_REGISTRY = CHART_REGISTRY.map((e) => e.metricsKey);

/** Fold metric lines into the record shape used by charts (single adapter). */
export function taxMetricsRecordFromLines(lines: readonly TaxMetricLine[]): TaxChartMetrics {
  const m = {} as TaxChartMetrics;
  for (const line of lines) {
    (m as Record<string, unknown>)[line.metricsKey as string] = line.value;
  }
  return m;
}

/**
 * Single driver: builds {@link TaxMetricLine}[] by iterating {@link CHART_REGISTRY} in order. Each `compute`
 * fills {@link ChartMetricComputeContext.accreted} via `accrete*` helpers and returns the metric value. Produces
 * {@link TaxChartMetrics} via {@link taxMetricsRecordFromLines}.
 */
export function computeTaxMetricLines(
  formRows: TaxFormRow[],
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
): TaxMetricLine[] {
  const ctx = buildChartMetricComputeContext(formRows, inputs, config);
  return CHART_REGISTRY.map((entry) => ({
    id: entry.visualizationSourceId ?? String(entry.metricsKey),
    metricsKey: entry.metricsKey,
    valueKind: entry.valueKind,
    value: entry.compute(ctx) as TaxMetricComputedValue,
  }));
}

export function computeTaxChartMetricsFromRegistry(
  formRows: TaxFormRow[],
  _state: TaxCalculationState,
  config: TaxYearConfig,
): TaxChartMetrics {
  const lines = computeTaxMetricLines(formRows, _state.inputs, config);
  return taxMetricsRecordFromLines(lines);
}

/** Build VISUALIZATION_METRIC_ID_TO_CHART_KEY from registry `visualizationSourceId` fields. */
export function buildVisualizationMetricIdToChartKey(): Partial<Record<string, keyof TaxChartMetrics>> {
  const out: Partial<Record<string, keyof TaxChartMetrics>> = {};
  for (const e of CHART_REGISTRY) {
    if (e.visualizationSourceId) {
      out[e.visualizationSourceId] = e.metricsKey;
    }
  }
  return out;
}

/** Stable keys for segment arrays (from registry; use instead of string literals in charts). */
const METRIC_KEY_ORDINARY_FEDERAL_SEGMENTS = CHART_REGISTRY.find(
  (e) => e.metricsKey === "ordinaryFederalSegments",
)!.metricsKey;

const METRIC_KEY_LONG_TERM_CAPGAINS_SEGMENTS = CHART_REGISTRY.find(
  (e) => e.metricsKey === "longTermCapitalGainsSegments",
)!.metricsKey;

export function getOrdinaryFederalSegments(m: TaxChartMetrics): TaxSegment[] {
  return m[METRIC_KEY_ORDINARY_FEDERAL_SEGMENTS] as TaxSegment[];
}

export function getLongTermCapitalGainsSegments(m: TaxChartMetrics): TaxSegment[] {
  return m[METRIC_KEY_LONG_TERM_CAPGAINS_SEGMENTS] as TaxSegment[];
}

function getCategoryColor(category: DisplayItemConfig["category"]): string {
  const colors: Record<DisplayItemConfig["category"], string> = {
    income: "#22c55e",
    pretax: "#a855f7",
    deduction: "#f59e0b",
    tax: "#ef4444",
    credit: "#14b8a6",
    summary: "#0d9488",
  };
  return colors[category];
}

function chartMetricNumericForDisplay(m: TaxChartMetrics, key: keyof TaxChartMetrics): number {
  const v = m[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Detailed breakdown rows from registry `detailedDisplay` metadata. */
function buildDisplayItemsConfig(): DisplayItemConfig[] {
  return CHART_REGISTRY.filter((e) => e.detailedDisplay != null)
    .map((e) => {
      const d = e.detailedDisplay!;
      const label = d.label ?? e.summary?.label ?? String(e.metricsKey);
      const format = (d.format ?? e.summary?.format ?? "currency") as DisplayItemFormat;
      return {
        type: d.type,
        label,
        category: d.category,
        format,
        order: d.order,
        metricsKey: e.metricsKey,
        color: d.color ?? getCategoryColor(d.category),
        tooltip: d.tooltip,
        highlight: d.highlight ?? e.summary?.highlight,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export const DISPLAY_ITEMS_CONFIG: DisplayItemConfig[] = buildDisplayItemsConfig();

/** Display items from resolved chart metrics (same values as this registry). */
export function buildDisplayItems(m: TaxChartMetrics): DisplayItem[] {
  const displayItems: DisplayItem[] = [];
  for (const config of DISPLAY_ITEMS_CONFIG) {
    const amount = chartMetricNumericForDisplay(m, config.metricsKey);
    displayItems.push({
      type: config.type,
      amount,
      label: config.label,
      category: config.category,
      color: config.color,
      format: config.format,
      order: config.order,
      tooltip: config.tooltip,
      highlight: config.highlight,
    });
  }
  return displayItems.sort((a, b) => a.order - b.order);
}
