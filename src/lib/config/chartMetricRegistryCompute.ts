/**
 * Pipeline accretion for chart metrics: {@link ChartMetricComputeContext}, `accrete*` helpers, and
 * {@link buildChartMetricComputeContext}. Used by {@link TAX_CALC_REGISTRY} in `TAX_CALC_REGISTRY.ts`.
 */
import type { IncomeKind } from "~/lib/taxCalc.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { TaxCalculationInputs, TaxPipelineSnapshot } from "~/lib/taxConfig.types";
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
import type { PretaxBenefitConfig, ChartCategory, SankeyNodeKind } from "~/lib/config/taxItems";

/** Fold income sources into aggregation fields (`map` seeds zeros, `reduce` sums amounts). */
function aggregateIncomeFieldsFromSources(
  sources: TaxCalculationInputs["incomeSources"],
): Record<string, number> {
  return sources.reduce(
    (acc: Record<string, number>, src) => {
      const cfg = INCOME_KIND_CONFIGS.find((c) => c.id === src.kind);
      if (cfg) acc[cfg.aggregationField] += src.amount;
      return acc;
    },
    Object.fromEntries(INCOME_KIND_CONFIGS.map((c) => [c.aggregationField, 0])) as Record<string, number>,
  );
}

function incomeAggregationResultFromCi(
  filingStatus: TaxCalculationInputs["filingStatus"],
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
  filingStatus: TaxCalculationInputs["filingStatus"],
  pretaxBenefitSources: TaxCalculationInputs["pretaxBenefitSources"],
  config: TaxYearConfig,
  income: IncomeAggregationResult,
): PretaxBenefitsResult {
  const joint = filingStatus === "marriedJoint";
  const limits = config.pretaxLimits;

  const aggregated = pretaxBenefitSources.reduce(
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

function computeDeduction(
  filingStatus: TaxCalculationInputs["filingStatus"],
  itemizedDeductions: TaxCalculationInputs["itemizedDeductions"],
  useItemizedDeductions: TaxCalculationInputs["useItemizedDeductions"],
  config: TaxYearConfig,
): DeductionCalculationResult {
  const standardDeduction = config.standardDeduction[filingStatus];

  const itemizedAggregated = itemizedDeductions.reduce(
    (acc, ded) => {
      const cfg = DEDUCTION_KIND_CONFIGS.find((c) => c.id === ded.kind);
      if (cfg) acc[cfg.aggregationField] += ded.amount;
      return acc;
    },
    Object.fromEntries(DEDUCTION_KIND_CONFIGS.map((c) => [c.aggregationField, 0])) as Record<string, number>,
  );

  const itemizedDeductionsTotal = Object.values(itemizedAggregated).reduce((s, n) => s + n, 0);

  const useItemized = useItemizedDeductions && itemizedDeductionsTotal > standardDeduction;
  const deductionAmount = useItemized ? itemizedDeductionsTotal : standardDeduction;

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
  config: TaxYearConfig,
  filingStatus: TaxCalculationInputs["filingStatus"],
  income: IncomeAggregationResult,
  pretax: PretaxBenefitsResult,
  deduction: DeductionCalculationResult,
): FederalOrdinaryTaxResult {
  const wageIncome = income.wageIncome;
  const selfEmploymentIncome = income.selfEmploymentIncome;
  const ordinaryIncome = income.ordinaryIncome;
  const shortTermCapGains = income.shortTermCapGains;
  const preTaxTotal = pretax.amount;
  const deductionAmount = deduction.amount;

  const ordinaryAfterPretax = wageIncome + selfEmploymentIncome + ordinaryIncome + shortTermCapGains - preTaxTotal;
  const ordinaryTaxableIncome = Math.max(0, ordinaryAfterPretax - deductionAmount);

  const brackets = config.federalBrackets[filingStatus];
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
  config: TaxYearConfig,
  filingStatus: TaxCalculationInputs["filingStatus"],
  income: IncomeAggregationResult,
  deduction: DeductionCalculationResult,
  federalOrdinary: FederalOrdinaryTaxResult,
): FederalLtcgTaxResult {
  const longTermCapGains = income.longTermCapGains;
  const deductionAmount = deduction.amount;
  const ordinaryTaxableIncome = federalOrdinary.ordinaryTaxableIncome;

  const remainingDeduction = Math.max(0, deductionAmount - ordinaryTaxableIncome);
  const longTermTaxableIncome = Math.max(0, longTermCapGains - remainingDeduction);

  const ltcgThresholds = config.longTermCapGains[filingStatus];
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
  filingStatus: TaxCalculationInputs["filingStatus"],
  config: TaxYearConfig,
  income: IncomeAggregationResult,
  federalLtcg: FederalLtcgTaxResult,
): FederalNiitResult {
  const wageIncome = income.wageIncome;
  const selfEmploymentIncome = income.selfEmploymentIncome;
  const ordinaryIncome = income.ordinaryIncome;
  const shortTermCapGains = income.shortTermCapGains;
  const longTermTaxableIncome = federalLtcg.longTermTaxableIncome;

  const magi = wageIncome + selfEmploymentIncome + ordinaryIncome + shortTermCapGains + income.longTermCapGains;
  const netInvestmentIncome = shortTermCapGains + longTermTaxableIncome;
  const threshold = config.niit.magiThreshold[filingStatus];

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
  federalTaxCredits: TaxCalculationInputs["federalTaxCredits"],
  ordinaryTax: FederalOrdinaryTaxResult,
  ltcgTax: FederalLtcgTaxResult,
  niit: FederalNiitResult,
): TaxCreditsResult {
  const totalTaxLiability = ordinaryTax.amount + ltcgTax.amount + niit.amount;

  const creditsAggregated = federalTaxCredits.reduce(
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
  filingStatus: TaxCalculationInputs["filingStatus"],
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
  const additionalMedicareThreshold = config.payroll.additionalMedicareThreshold[filingStatus];
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

function computeSelfEmploymentInner(
  incomeSources: TaxCalculationInputs["incomeSources"],
  filingStatus: TaxCalculationInputs["filingStatus"],
  config: TaxYearConfig,
): SelfEmploymentTaxResult {
  const seConfig = SELF_EMPLOYMENT_CONFIGS[0];

  const selfEmploymentIncome = incomeSources
    .filter((s) => s.kind === "selfEmployment")
    .reduce((sum, s) => sum + s.amount, 0);

  const netEarnings = selfEmploymentIncome * seConfig.netEarningsRate;

  const wageBase = config.payroll.socialSecurityWageBase;
  const ssRate = config.payroll.socialSecurityRate * seConfig.ssMultiplier;
  const medicareRate = config.payroll.medicareRate * seConfig.ssMultiplier;
  const additionalMedicareRate = config.payroll.additionalMedicareRate * seConfig.ssMultiplier;

  const additionalThreshold = config.payroll.additionalMedicareThreshold[filingStatus];

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
  filingStatus: TaxCalculationInputs["filingStatus"];
  incomeSources: TaxCalculationInputs["incomeSources"];
  pretaxBenefitSources: TaxCalculationInputs["pretaxBenefitSources"];
  itemizedDeductions: TaxCalculationInputs["itemizedDeductions"];
  useItemizedDeductions: TaxCalculationInputs["useItemizedDeductions"];
  federalTaxCredits: TaxCalculationInputs["federalTaxCredits"];
  config: TaxYearConfig;
  /** Filled incrementally as registry `compute` functions run (via `accrete*` helpers). */
  accreted: ChartPipelineAccretion;
};

export function accreteIncome(ctx: ChartMetricComputeContext): IncomeAggregationResult {
  if (!ctx.accreted.income) {
    const aggregated = aggregateIncomeFieldsFromSources(ctx.incomeSources);
    ctx.accreted.income = incomeAggregationResultFromCi(ctx.filingStatus, aggregated);
  }
  return ctx.accreted.income!;
}

export function accretePretax(ctx: ChartMetricComputeContext): PretaxBenefitsResult {
  const income = accreteIncome(ctx);
  if (!ctx.accreted.pretax) {
    ctx.accreted.pretax = computePretaxBenefits(ctx.filingStatus, ctx.pretaxBenefitSources, ctx.config, income);
  }
  return ctx.accreted.pretax!;
}

export function accreteDeduction(ctx: ChartMetricComputeContext): DeductionCalculationResult {
  if (!ctx.accreted.deduction) {
    ctx.accreted.deduction = computeDeduction(
      ctx.filingStatus,
      ctx.itemizedDeductions,
      ctx.useItemizedDeductions,
      ctx.config,
    );
  }
  return ctx.accreted.deduction!;
}

export function accreteFederalOrdinary(ctx: ChartMetricComputeContext): FederalOrdinaryTaxResult {
  if (!ctx.accreted.federalOrdinary) {
    ctx.accreted.federalOrdinary = computeFederalOrdinary(
      ctx.config,
      ctx.filingStatus,
      accreteIncome(ctx),
      accretePretax(ctx),
      accreteDeduction(ctx),
    );
  }
  return ctx.accreted.federalOrdinary!;
}

export function accreteFederalLtcg(ctx: ChartMetricComputeContext): FederalLtcgTaxResult {
  if (!ctx.accreted.federalLtcg) {
    ctx.accreted.federalLtcg = computeFederalLtcgInner(
      ctx.config,
      ctx.filingStatus,
      accreteIncome(ctx),
      accreteDeduction(ctx),
      accreteFederalOrdinary(ctx),
    );
  }
  return ctx.accreted.federalLtcg!;
}

export function accreteNiit(ctx: ChartMetricComputeContext): FederalNiitResult {
  if (!ctx.accreted.niit) {
    ctx.accreted.niit = computeNiit(ctx.filingStatus, ctx.config, accreteIncome(ctx), accreteFederalLtcg(ctx));
  }
  return ctx.accreted.niit!;
}

export function accreteTaxCredits(ctx: ChartMetricComputeContext): TaxCreditsResult {
  if (!ctx.accreted.taxCredits) {
    ctx.accreted.taxCredits = computeTaxCreditsInner(
      ctx.federalTaxCredits,
      accreteFederalOrdinary(ctx),
      accreteFederalLtcg(ctx),
      accreteNiit(ctx),
    );
  }
  return ctx.accreted.taxCredits!;
}

export function accretePayroll(ctx: ChartMetricComputeContext): PayrollTaxResult {
  if (!ctx.accreted.payroll) {
    ctx.accreted.payroll = computePayrollInner(ctx.filingStatus, ctx.config, accreteIncome(ctx), accretePretax(ctx));
  }
  return ctx.accreted.payroll!;
}

export function accreteSelfEmployment(ctx: ChartMetricComputeContext): SelfEmploymentTaxResult {
  if (!ctx.accreted.selfEmployment) {
    ctx.accreted.selfEmployment = computeSelfEmploymentInner(
      ctx.incomeSources,
      ctx.filingStatus,
      ctx.config,
    );
  }
  return ctx.accreted.selfEmployment!;
}

export function accreteTakeHome(ctx: ChartMetricComputeContext): TakeHomeResult {
  if (!ctx.accreted.takeHome) {
    ctx.accreted.takeHome = computeTakeHomeInner(
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
 * that bar; first row in {@link TAX_CALC_REGISTRY} wins if the same `kind` appears twice.
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
  /** Primary structural node for this metric's Sankey `kind` (merge with {@link structuralNodes} when collecting). */
  structuralNode?: SankeyNodeLayoutEntry;
  /** Additional structural nodes when this metric owns more than one bar (e.g. ordinary taxable + payroll strip). */
  structuralNodes?: readonly SankeyNodeLayoutEntry[];
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
  /** Omit from summary when this row’s metric value is zero or negative. */
  hideWhenZero?: boolean;
};

export function incomeSummary(incomeKindId: string, displayOrder: number): ChartMetricSummaryHint {
  const cfg = INCOME_KIND_CONFIGS.find((c) => c.id === incomeKindId)!;
  return { summaryId: cfg.id, label: cfg.label, category: "income", displayOrder };
}

export function pretaxSummaryRow(cfg: PretaxBenefitConfig, displayOrder: number): ChartMetricSummaryHint {
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

export function federalCreditSummary(cfg: (typeof FEDERAL_CREDIT_CONFIGS)[number], displayOrder: number): ChartMetricSummaryHint {
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
    filingStatus: inputs.filingStatus,
    incomeSources: inputs.incomeSources,
    pretaxBenefitSources: inputs.pretaxBenefitSources,
    itemizedDeductions: inputs.itemizedDeductions,
    useItemizedDeductions: inputs.useItemizedDeductions,
    federalTaxCredits: inputs.federalTaxCredits,
    config,
    accreted: {},
  };
}
