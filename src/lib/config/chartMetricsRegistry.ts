/**
 * Unified tax calculation registry: each metric defines identity, `compute`, optional Sankey/Mekko/summary hints,
 * and serialization order. See {@link CHART_METRICS_REGISTRY}.
 *
 * **Evaluation contract:** Tax math for chart metrics runs only through {@link computeTaxMetricLines}. Each registry
 * `compute` mutates {@link ChartMetricComputeContext.accreted} on demand (calling private `accrete*` helpers that wrap
 * the former pipeline steps). There is no {@link TaxPipelineSnapshot} object or separate pipeline builder—only this
 * loop and shared helpers. The only preparation outside this module is resolving which {@link TaxYearConfig} applies.
 *
 * **Detailed display list:** Rows with {@link ChartMetricRegistryEntry.detailedDisplay} drive {@link buildDisplayItemsConfig}
 * (single add/remove point with the registry).
 *
 * **Sankey:** Optional {@link ChartMetricRegistryEntry.sankey} `phase` + `append` contribute nodes/links when
 * {@link sankeyRegistryRunner.runSankeyRegistryAppendersForPhase} runs for that phase. Not every metric maps 1:1 to graph elements (e.g. gross
 * uses one node per income form row); unmigrated phases still use `taxCharts.sankeyPhase*` helpers.
 */
import type { DeductionKind, TaxSegment } from "~/lib/taxCalc.types";
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
    sources: ci.incomeSources,
    totalIncome,
  };
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
      const cfg = PRETAX_BENEFIT_CONFIGS.find((c) => c.id === src.kind);
      if (!cfg) return acc;
      const isSpouse2 = src.id.includes("spouse2");
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
  const k401s1 = pick("401k")?.effective1 ?? 0;
  const k401s2 = pick("401k")?.effective2 ?? 0;
  const hsaT = pick("hsa")?.effective ?? 0;
  const hsaS1 = pick("hsa")?.effective1 ?? 0;
  const hsaS2 = pick("hsa")?.effective2 ?? 0;
  const iraT = pick("traditionalIra")?.effective ?? 0;
  const iraS1 = pick("traditionalIra")?.effective1 ?? 0;
  const iraS2 = pick("traditionalIra")?.effective2 ?? 0;
  const otherT = pick("other")?.effective ?? 0;

  const wageIncome = income.wageIncome;
  const wagesAfterPretax = Math.max(0, wageIncome - totalPretax - totalIra);

  return {
    id: "pretax-benefits",
    label: "Pre-tax Benefits",
    amount: totalPretax,
    category: "pretax",
    "401k": k401,
    "401kSpouse1": k401s1,
    "401kSpouse2": k401s2,
    hsa: hsaT,
    hsaSpouse1: hsaS1,
    hsaSpouse2: hsaS2,
    ira: iraT,
    iraSpouse1: iraS1,
    iraSpouse2: iraS2,
    other: otherT,
    totalPretax,
    traditionalIra: totalIra,
    wagesAfterPretax,
    effective401k: k401,
    effectiveHsa: hsaT,
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
    itemizedDeductions,
    salt: itemizedAggregated.salt ?? 0,
    medicalDental: itemizedAggregated.medicalDental ?? 0,
    mortgageInterest: itemizedAggregated.mortgageInterest ?? 0,
    charitable: itemizedAggregated.charitable ?? 0,
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
  const { tax: totalTax, marginalRate, segments } = calculateBracketTax(ordinaryTaxableIncome, brackets);

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
    marginalRate,
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
    longTermCapGains,
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
    magi,
    magiOverThreshold,
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
    additionalMedicare,
    wagesForPayroll,
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
    seSocialSecurityTax,
    seMedicareTax,
    additionalMedicareTax: additionalMedicare,
    netEarnings,
    selfEmploymentIncome,
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
    totalIncome,
    preTaxTotal,
    federalTax,
    payrollTax: payroll,
    pretaxIra,
    wagesAfterPretax,
    selfEmploymentTax,
    totalTax,
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

export type ChartMetricSankeyHint = {
  sankeyNodeKind?: SankeyNodeKind;
  chartCategory?: ChartCategory;
  showWhen?: (ctx: ChartMetricComputeContext) => boolean;
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

/** Row in the detailed income/tax breakdown panel; lives on registry entries as {@link ChartMetricRegistryEntry.detailedDisplay}. */
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

export type ChartMetricRegistryEntry = {
  metricsKey: keyof TaxChartMetrics;
  emitAsComputedRow: boolean;
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

/**
 * Ordered: this array order is the single source for resolve and pipeline serialization.
 *
 * Each `compute` calls `accrete*` helpers and reads {@link ChartMetricComputeContext.accreted}.
 */
export const CHART_METRICS_REGISTRY: readonly ChartMetricRegistryEntry[] = [
  {
    metricsKey: "totalIncome",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "total-income",
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
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "wages",
    summary: incomeSummary("wages", 1),
    detailedDisplay: { order: 100, type: "wages", category: "income" },
    compute: (ctx) => accreteIncome(ctx).wageIncome,
  },
  {
    metricsKey: "selfEmploymentIncome",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "selfEmployment",
    summary: incomeSummary("selfEmployment", 2),
    detailedDisplay: { order: 101, type: "selfemployment", category: "income" },
    compute: (ctx) => accreteIncome(ctx).selfEmploymentIncome,
  },
  {
    metricsKey: "ordinaryGrossIncome",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "ordinary",
    summary: incomeSummary("ordinary", 3),
    detailedDisplay: { order: 102, type: "ordinary", category: "income" },
    compute: (ctx) => {
      const i = accreteIncome(ctx);
      return i.ordinaryIncome + i.shortTermCapGains;
    },
  },
  {
    metricsKey: "shortTermCapGainsGrossIncome",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "shortTermCapGains",
    summary: incomeSummary("shortTermCapGains", 4),
    detailedDisplay: { order: 103, type: "shorttermcapgains", category: "income" },
    compute: (ctx) => accreteIncome(ctx).shortTermCapGains,
  },
  {
    metricsKey: "longTermCapitalGainsGrossIncome",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "longTermCapGains",
    summary: incomeSummary("longTermCapGains", 5),
    detailedDisplay: { order: 104, type: "longtermcapgains", category: "income" },
    compute: (ctx) => accreteIncome(ctx).longTermCapGains,
  },
  {
    metricsKey: "preTax401k",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "preTax401k",
    summary: pretaxSummaryRow(PRETAX_BENEFIT_CONFIGS[0], 7),
    detailedDisplay: { order: 106, type: "401k", category: "pretax" },
    compute: (ctx) => accretePretax(ctx)["401k"],
  },
  {
    metricsKey: "preTaxHsa",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "preTaxHsa",
    summary: pretaxSummaryRow(PRETAX_BENEFIT_CONFIGS[1], 8),
    detailedDisplay: { order: 107, type: "hsa", category: "pretax" },
    compute: (ctx) => accretePretax(ctx).hsa,
  },
  {
    metricsKey: "preTaxOther",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "preTaxOther",
    summary: pretaxSummaryRow(PRETAX_BENEFIT_CONFIGS[3], 10),
    detailedDisplay: { order: 109, type: "other", category: "pretax" },
    compute: (ctx) => accretePretax(ctx).other,
  },
  {
    metricsKey: "preTaxTotal",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "preTaxTotal",
    detailedDisplay: {
      order: 110,
      type: "total-pretax",
      category: "pretax",
      label: "Total Pre-tax",
      tooltip: "Total pre-tax deductions",
      color: "#7e22ce",
    },
    compute: (ctx) => accretePretax(ctx).totalPretax,
  },
  {
    metricsKey: "traditionalIra",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "traditionalIra",
    summary: pretaxSummaryRow(PRETAX_BENEFIT_CONFIGS[2], 9),
    detailedDisplay: { order: 108, type: "traditional-ira", category: "pretax" },
    compute: (ctx) => accretePretax(ctx).traditionalIra,
  },
  {
    metricsKey: "wagesAfterPretax",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "wages-after-pretax",
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
  {
    metricsKey: "deductionKind",
    emitAsComputedRow: false,
    valueKind: "deductionKind",
    compute: (ctx) => accreteDeduction(ctx).kind,
  },
  {
    metricsKey: "standardDeduction",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "standard-deduction",
    summary: { summaryId: "standard-deduction", label: "Standard Deduction", category: "deduction", displayOrder: 12 },
    detailedDisplay: { order: 112, type: "standard-deduction", category: "deduction" },
    compute: (ctx) => accreteDeduction(ctx).standardDeduction,
  },
  {
    metricsKey: "deductionAmount",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "deduction-amount",
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
    emitAsComputedRow: true,
    valueKind: "number",
    compute: () => 0,
  },
  {
    metricsKey: "deductionAllocatedToLongTermGross",
    emitAsComputedRow: true,
    valueKind: "number",
    compute: () => 0,
  },
  {
    metricsKey: "ordinaryTaxableIncome",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "ordinary-taxable-income",
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
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "long-term-taxable-income",
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
    emitAsComputedRow: true,
    valueKind: "number",
    compute: (ctx) =>
      accreteFederalOrdinary(ctx).ordinaryTaxableIncome + accreteFederalLtcg(ctx).longTermTaxableIncome,
  },
  {
    metricsKey: "ordinaryFederalSegments",
    emitAsComputedRow: false,
    valueKind: "segments",
    sankey: {
      sankeyNodeKind: "ordinaryBracket",
      chartCategory: "tax",
      phase: "brackets",
      append: appendOrdinaryBracketSankey,
    },
    mekko: { role: "ordinaryBracket", usesSegments: true },
    compute: (ctx) => accreteFederalOrdinary(ctx).segments,
  },
  {
    metricsKey: "longTermCapitalGainsSegments",
    emitAsComputedRow: false,
    valueKind: "segments",
    sankey: {
      sankeyNodeKind: "ltcgBracket",
      chartCategory: "tax",
      phase: "brackets",
      append: appendLtcgBracketSankey,
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
    emitAsComputedRow: true,
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
    emitAsComputedRow: true,
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
    emitAsComputedRow: true,
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
    emitAsComputedRow: true,
    valueKind: "number",
    compute: (ctx) => accreteNiit(ctx).netInvestmentIncome,
  },
  {
    metricsKey: "federalIncomeTaxBeforeCredits",
    emitAsComputedRow: true,
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
    emitAsComputedRow: true,
    valueKind: "number",
    compute: (ctx) => accreteTaxCredits(ctx).creditsEntered,
  },
  {
    metricsKey: "federalTaxCreditsApplied",
    emitAsComputedRow: true,
    valueKind: "number",
    sankey: { sankeyNodeKind: "federalCredits", chartCategory: "tax" },
    compute: (ctx) => accreteTaxCredits(ctx).creditsApplied,
  },
  {
    metricsKey: "federalIncomeTax",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "federal-income-tax",
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
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "payroll-tax",
    sankey: { sankeyNodeKind: "taxesPayroll", chartCategory: "tax" },
    summary: { summaryId: "payroll-tax", label: "Payroll Taxes", category: "tax", displayOrder: 27 },
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
    emitAsComputedRow: true,
    valueKind: "number",
    compute: (ctx) => accreteSelfEmployment(ctx).amount,
  },
  {
    metricsKey: "socialSecurityTax",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "social-security-tax",
    summary: { summaryId: "social-security-tax", label: "Social Security Tax", category: "tax", displayOrder: 25 },
    detailedDisplay: { order: 121, type: "social-security-tax", category: "tax", label: "Social Security Tax", color: "#3b82f6" },
    compute: (ctx) => accretePayroll(ctx).socialSecurityTax,
  },
  {
    metricsKey: "medicareTax",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "medicare-tax",
    summary: { summaryId: "medicare-tax", label: "Medicare Tax", category: "tax", displayOrder: 26 },
    detailedDisplay: { order: 122, type: "medicare-tax", category: "tax", label: "Medicare Tax", color: "#3b82f6" },
    compute: (ctx) => accretePayroll(ctx).medicareTax,
  },
  {
    metricsKey: "takeHomePay",
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "take-home-pay",
    sankey: { sankeyNodeKind: "keep", chartCategory: "keep" },
    summary: {
      summaryId: "take-home-pay",
      label: "Take-Home Pay",
      category: "takehome",
      displayOrder: 28,
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
    emitAsComputedRow: true,
    valueKind: "number",
    visualizationSourceId: "effective-rate",
    summary: {
      summaryId: "effective-rate",
      label: "Effective Tax Rate",
      category: "rate",
      displayOrder: 29,
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
    emitAsComputedRow: false,
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
    emitAsComputedRow: false,
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
    emitAsComputedRow: false,
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
    emitAsComputedRow: false,
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
    emitAsComputedRow: false,
    valueKind: "number",
    summary: {
      summaryId: "marginal-rate",
      label: "Marginal Rate",
      category: "rate",
      displayOrder: 30,
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

/** Keys in resolve / `TAX_CHART_METRICS_KEYS` order. */
export const TAX_CHART_METRICS_KEYS_FROM_REGISTRY = CHART_METRICS_REGISTRY.map((e) => e.metricsKey);

export const SEGMENT_METRIC_KEYS_FROM_REGISTRY = new Set(
  CHART_METRICS_REGISTRY.filter((e) => e.valueKind === "segments").map((e) => e.metricsKey),
);

/** Pipeline serialization order (matches registry array order). */
export const PIPELINE_COMPUTED_ROW_ORDER_FULL_FROM_REGISTRY = CHART_METRICS_REGISTRY.map((e) => e.metricsKey);

/** Fold metric lines into the record shape used by charts (single adapter). */
export function taxMetricsRecordFromLines(lines: readonly TaxMetricLine[]): TaxChartMetrics {
  const m = {} as TaxChartMetrics;
  for (const line of lines) {
    (m as Record<string, unknown>)[line.metricsKey as string] = line.value;
  }
  return m;
}

/**
 * Single driver: builds {@link TaxMetricLine}[] by iterating {@link CHART_METRICS_REGISTRY} in order. Each `compute`
 * fills {@link ChartMetricComputeContext.accreted} via `accrete*` helpers and returns the metric value. Produces
 * {@link TaxChartMetrics} via {@link taxMetricsRecordFromLines}.
 */
export function computeTaxMetricLines(
  formRows: TaxFormRow[],
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
): TaxMetricLine[] {
  const ctx = buildChartMetricComputeContext(formRows, inputs, config);
  return CHART_METRICS_REGISTRY.map((entry) => ({
    id: entry.visualizationSourceId ?? String(entry.metricsKey),
    metricsKey: entry.metricsKey,
    valueKind: entry.valueKind,
    value: entry.compute(ctx) as TaxMetricComputedValue,
    emitAsComputedRow: entry.emitAsComputedRow,
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
  for (const e of CHART_METRICS_REGISTRY) {
    if (e.visualizationSourceId) {
      out[e.visualizationSourceId] = e.metricsKey;
    }
  }
  return out;
}

/** Stable keys for segment arrays (from registry; use instead of string literals in charts). */
const METRIC_KEY_ORDINARY_FEDERAL_SEGMENTS = CHART_METRICS_REGISTRY.find(
  (e) => e.metricsKey === "ordinaryFederalSegments",
)!.metricsKey;

const METRIC_KEY_LONG_TERM_CAPGAINS_SEGMENTS = CHART_METRICS_REGISTRY.find(
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
  return CHART_METRICS_REGISTRY.filter((e) => e.detailedDisplay != null)
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
