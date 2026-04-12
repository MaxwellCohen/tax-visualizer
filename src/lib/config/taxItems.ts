import type { TaxCalculationInputs, TaxCalculationState, TaxItemResult, TaxItemCategory } from "~/lib/taxConfig.types";
import type { PretaxBenefitKind } from "~/lib/taxCalc.types";
import type { TaxYearConfig } from "~/lib/taxData.types";

const ELECTIVE_DEFERRAL_KINDS: readonly PretaxBenefitKind[] = [
  "preTax401kSpouse1",
  "preTax403bSpouse1",
  "preTax457bSpouse1",
  "preTax401kSpouse2",
  "preTax403bSpouse2",
  "preTax457bSpouse2",
];

const HSA_PRETAX_KINDS: readonly PretaxBenefitKind[] = ["preTaxHsaSpouse1", "preTaxHsaSpouse2"];

export type IncomeKindConfig = {
  id: string;
  label: string;
  aggregationField: string;
};

export const INCOME_KIND_CONFIGS: IncomeKindConfig[] = [
  { id: "wages", label: "Wages", aggregationField: "wageIncome" },
  { id: "selfEmployment", label: "Self-Employment", aggregationField: "selfEmploymentIncome" },
  { id: "ordinary", label: "Ordinary Income", aggregationField: "ordinaryIncome" },
  { id: "shortTermCapGains", label: "Short-Term Capital Gains", aggregationField: "shortTermCapGains" },
  { id: "longTermCapGains", label: "Long-Term Capital Gains", aggregationField: "longTermCapGains" },
];

/** Display item `type` for an income kind; must match `buildDisplayItemsConfig` (`makeDisplayItemConfig` first arg). */
export function incomeKindIdToDisplayType(kindId: string): string {
  return kindId.replace(" ", "-").toLowerCase();
}

export type DeductionKindConfig = {
  id: string;
  label: string;
  aggregationField: string;
};

export const DEDUCTION_KIND_CONFIGS: DeductionKindConfig[] = [
  { id: "salt", label: "State & Local Taxes", aggregationField: "salt" },
  { id: "medicalDental", label: "Medical & Dental", aggregationField: "medicalDental" },
  { id: "mortgageInterest", label: "Mortgage Interest", aggregationField: "mortgageInterest" },
  { id: "charitable", label: "Charitable Contributions", aggregationField: "charitable" },
];

export const LTCG_BRACKET_CONFIGS: Array<{ rate: number; thresholdKey: "zeroRateMax" | "fifteenRateMax" | null }> = [
  { rate: 0, thresholdKey: "zeroRateMax" },
  { rate: 0.15, thresholdKey: "fifteenRateMax" },
  { rate: 0.20, thresholdKey: null },
];

export function calculateLtcgTax(
  taxableLtcg: number,
  thresholds: { zeroRateMax: number; fifteenRateMax: number },
  baseIncome: number,
): { tax: number; segments: TaxBracketSegment[] } {
  const segments: TaxBracketSegment[] = [];
  let totalTax = 0;
  let remaining = taxableLtcg;
  let lowerBound = baseIncome;

  for (const cfg of LTCG_BRACKET_CONFIGS) {
    if (remaining <= 0) break;

    const upperBound = cfg.thresholdKey ? thresholds[cfg.thresholdKey] : Number.POSITIVE_INFINITY;
    const amountInBracket = Math.max(0, Math.min(remaining, Math.max(0, upperBound - lowerBound)));
    
    if (amountInBracket > 0) {
      const taxAmount = amountInBracket * cfg.rate;
      totalTax += taxAmount;
      segments.push({
        rate: cfg.rate,
        upTo: cfg.thresholdKey ? thresholds[cfg.thresholdKey] : null,
        rangeStart: lowerBound,
        rangeEnd: cfg.thresholdKey ? thresholds[cfg.thresholdKey] : null,
        incomeAmount: amountInBracket,
        taxAmount,
      });
      remaining -= amountInBracket;
    }
    lowerBound = upperBound;
  }

  return { tax: totalTax, segments };
}

export type TaxBracketSegment = {
  rate: number;
  upTo: number | null;
  rangeStart: number;
  rangeEnd: number | null;
  incomeAmount: number;
  taxAmount: number;
};

export function calculateBracketTax(
  taxableIncome: number,
  brackets: Array<{ rate: number; upTo: number | null }>,
): { tax: number; marginalRate: number; segments: TaxBracketSegment[] } {
  let remaining = taxableIncome;
  let lowerBound = 0;
  let totalTax = 0;
  const usedSegments: TaxBracketSegment[] = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
    const amountInBracket = Math.min(remaining, upperBound - lowerBound);
    if (amountInBracket > 0) {
      const taxAmount = amountInBracket * bracket.rate;
      totalTax += taxAmount;
      remaining -= amountInBracket;
      usedSegments.push({
        rate: bracket.rate,
        upTo: bracket.upTo,
        rangeStart: lowerBound,
        rangeEnd: bracket.upTo,
        incomeAmount: amountInBracket,
        taxAmount,
      });
    }
    lowerBound = upperBound;
  }
  const marginalRate = usedSegments.slice(-1)[0]?.rate ?? 0;
  return { tax: totalTax, marginalRate, segments: usedSegments };
}

export type FieldType = "currency" | "percent" | "number";

export type SankeyNodeKind =
  | "incomeSource"
  | "pretaxContribution"
  | "deduction"
  | "deductionShield"
  | "ordinaryTaxableIncome"
  | "longTermTaxableIncome"
  | "ltcgDeductionShield"
  | "ordinaryBracket"
  | "ltcgBracket"
  | "taxesFederal"
  | "taxesPayroll"
  | "federalCredits"
  | "keep"
  | "deferredSink"
  | "standardDeduction"
  | "deductionBenefitSink"
  | "payrollOrdinaryStrip";

export type ChartCategory = "income" | "deduction" | "tax" | "keep";

export type TaxItemOutput = {
  key: string;
  type: FieldType;
  label: string;
  sankeyNodeKind?: SankeyNodeKind;
  chartCategory?: ChartCategory;
  showWhen?: (state: TaxCalculationState) => boolean;
  highlight?: boolean;
};

export type FederalCreditConfig = {
  id: string;
  label: string;
  aggregationField: string;
};

export const FEDERAL_CREDIT_CONFIGS: FederalCreditConfig[] = [
  { id: "childTaxCredit", label: "Child Tax Credit", aggregationField: "childTaxCredit" },
  { id: "educationCredits", label: "Education Credits", aggregationField: "educationCredits" },
  { id: "retirementSavingsContributions", label: "Retirement Savings Contributions", aggregationField: "retirementSavings" },
  { id: "other", label: "Other Federal Credit", aggregationField: "other" },
];

export type SelfEmploymentConfig = {
  id: string;
  label: string;
  netEarningsRate: number;
  ssMultiplier: number;
};

export const SELF_EMPLOYMENT_CONFIGS: SelfEmploymentConfig[] = [
  { id: "selfEmployment", label: "Self-Employment Income", netEarningsRate: 0.9235, ssMultiplier: 2 },
];

export type TaxWarningConfig = {
  id: string;
  condition: (state: TaxCalculationState, inputs: TaxCalculationInputs, config: TaxYearConfig) => boolean;
  message: (state: TaxCalculationState, inputs: TaxCalculationInputs, config: TaxYearConfig) => string;
};

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export const TAX_WARNING_CONFIGS: TaxWarningConfig[] = [
  {
    id: "pretax-no-wages",
    condition: (state, inputs, _config) => {
      const pretaxResult = state.results.get("pretax-benefits");
      const incomeResult = state.results.get("income-aggregation");
      const rawPretaxTotal = inputs.pretaxBenefitSources.reduce((sum, s) => sum + s.amount, 0);
      const wageIncome = (incomeResult?.metadata?.wageIncome as number) ?? 0;
      return rawPretaxTotal > 0 && wageIncome <= 0;
    },
    message: () => "Pre-tax payroll benefits only apply to W-2 wages in this model, so these entries have no effect without wage income.",
  },
  {
    id: "pretax-exceeds-wages",
    condition: (state, inputs, _config) => {
      const pretaxResult = state.results.get("pretax-benefits");
      const incomeResult = state.results.get("income-aggregation");
      const rawPretaxTotal = inputs.pretaxBenefitSources.reduce((sum, s) => sum + s.amount, 0);
      const wageIncome = (incomeResult?.metadata?.wageIncome as number) ?? 0;
      return rawPretaxTotal > wageIncome && wageIncome > 0;
    },
    message: () => "Pre-tax payroll benefits exceed W-2 wages, so the app scaled those entries down proportionally.",
  },
  {
    id: "401k-cap",
    condition: (state, inputs, config) => {
      const pretaxResult = state.results.get("pretax-benefits");
      const raw401k = inputs.pretaxBenefitSources
        .filter(s => ELECTIVE_DEFERRAL_KINDS.includes(s.kind))
        .reduce((sum, s) => sum + s.amount, 0);
      const effective401k = (pretaxResult?.metadata?.effective401k as number) ?? 0;
      return raw401k > effective401k && effective401k > 0;
    },
    message: (_state, _inputs, config) => `401(k) deferrals were capped at the ${config.standardDeduction.single > 0 ? Math.floor(config.standardDeduction.single * 1.5) : 24000} IRS elective deferral limit (${formatMoney(config.pretaxLimits.electiveDeferral401k)} per spouse).`,
  },
  {
    id: "hsa-cap",
    condition: (state, inputs, config) => {
      const pretaxResult = state.results.get("pretax-benefits");
      const rawHsa = inputs.pretaxBenefitSources
        .filter(s => HSA_PRETAX_KINDS.includes(s.kind))
        .reduce((sum, s) => sum + s.amount, 0);
      const effectiveHsa = (pretaxResult?.metadata?.effectiveHsa as number) ?? 0;
      return rawHsa > effectiveHsa && effectiveHsa > 0;
    },
    message: (_state, inputs, config) => {
      const joint = inputs.filingStatus === "marriedJoint";
      const hsaLimit = joint ? config.pretaxLimits.hsaFamily : config.pretaxLimits.hsaSelfOnly;
      return `HSA payroll amounts were capped at the IRS limit (${formatMoney(hsaLimit)}).`;
    },
  },
  {
    id: "itemized-below-standard",
    condition: (state, inputs, config) => {
      const deductionResult = state.results.get("deduction-calculation");
      const standardDeduction = config.standardDeduction[inputs.filingStatus];
      const itemizedAmount = (deductionResult?.metadata?.itemizedDeductions as number) ?? 0;
      return inputs.useItemizedDeductions && itemizedAmount < standardDeduction;
    },
    message: (_state, _inputs, config) => {
      return ""; // Will be filled in
    },
    // This one needs a special message builder based on inputs
  },
  {
    id: "ltcg-simplification",
    condition: (state, _inputs, _config) => {
      const incomeResult = state.results.get("income-aggregation");
      const ltcg = (incomeResult?.metadata?.longTermCapGains as number) ?? 0;
      return ltcg > 0;
    },
    message: () => "Long-term capital gains use a simplified 0% / 15% / 20% stacking worksheet and do not model qualified-dividend or special-gain edge cases.",
  },
  {
    id: "niit-estimation",
    condition: (state, _inputs, _config) => {
      const niitResult = state.results.get("federal-niit");
      return (niitResult?.amount ?? 0) > 0;
    },
    message: () => "Net investment income tax (NIIT) is estimated from short- and long-term gains only (Form 8960 is simplified).",
  },
  {
    id: "credits-exceed-tax",
    condition: (state, inputs, _config) => {
      const creditsResult = state.results.get("tax-credits");
      const ordinaryTax = state.results.get("federal-ordinary-tax");
      const ltcgTax = state.results.get("federal-ltcg-tax");
      const niit = state.results.get("federal-niit");
      const creditsEntered = inputs.federalTaxCredits.reduce((sum, c) => sum + c.amount, 0);
      const taxBeforeCredits = ((ordinaryTax?.amount ?? 0) + (ltcgTax?.amount ?? 0) + (niit?.amount ?? 0));
      return creditsEntered > taxBeforeCredits && taxBeforeCredits >= 0;
    },
    message: (_state, inputs, _config) => {
      const creditsEntered = inputs.federalTaxCredits.reduce((sum, c) => sum + c.amount, 0);
      return `Federal credits (${formatMoney(creditsEntered)}) exceed modeled federal income tax; excess nonrefundable credits are not modeled as a cash refund.`;
    },
  },
];

export function buildTaxWarnings(
  state: TaxCalculationState,
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
): string[] {
  const warnings: string[] = [];

  for (const warningConfig of TAX_WARNING_CONFIGS) {
    try {
      if (warningConfig.condition(state, inputs, config)) {
        const message = warningConfig.message(state, inputs, config);
        if (message) {
          warnings.push(message);
        }
      }
    } catch (e) {
      // Skip warnings that fail to evaluate
    }
  }

  // Special handling for itemized vs standard
  const deductionResult = state.results.get("deduction-calculation");
  const standardDeduction = config.standardDeduction[inputs.filingStatus];
  const itemizedAmount = (deductionResult?.metadata?.itemizedDeductions as number) ?? 0;
  if (inputs.useItemizedDeductions && itemizedAmount < standardDeduction && itemizedAmount > 0) {
    warnings.push(
      `Your itemized deduction is below the ${formatMoney(standardDeduction)} standard deduction for this filing status, so a real return would usually prefer the standard deduction.`,
    );
  }

  return warnings;
}

function calculateSelfEmploymentTax(
  inputs: TaxCalculationInputs,
  _state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const seConfig = SELF_EMPLOYMENT_CONFIGS[0];
  
  const selfEmploymentIncome = inputs.incomeSources
    .filter(s => s.kind === "selfEmployment")
    .reduce((sum, s) => sum + s.amount, 0);
  
  const netEarnings = selfEmploymentIncome * seConfig.netEarningsRate;
  
  const wageBase = config.payroll.socialSecurityWageBase;
  const ssRate = config.payroll.socialSecurityRate * seConfig.ssMultiplier;
  const medicareRate = config.payroll.medicareRate * seConfig.ssMultiplier;
  const additionalMedicareRate = config.payroll.additionalMedicareRate * seConfig.ssMultiplier;
  
  const additionalThreshold = config.payroll.additionalMedicareThreshold[inputs.filingStatus];
  
  const seSocialSecurityTax = Math.min(netEarnings, wageBase) * ssRate;
  const seMedicareTax = netEarnings * medicareRate;
  const additionalMedicare = netEarnings > additionalThreshold 
    ? (netEarnings - additionalThreshold) * additionalMedicareRate 
    : 0;
  const selfEmploymentTax = seSocialSecurityTax + seMedicareTax + additionalMedicare;

  return {
    id: "self-employment-tax",
    label: "Self-Employment Tax",
    amount: selfEmploymentTax,
    category: "tax",
    metadata: {
      selfEmploymentTax,
      seSocialSecurityTax,
      seMedicareTax,
      additionalMedicareTax: additionalMedicare,
      netEarnings,
      selfEmploymentIncome,
    },
  };
}

function makeDisplayItemConfig(
  type: string,
  label: string,
  category: DisplayCategory,
  order: number,
  sourceId: string,
  sourceField: string,
  options?: Partial<DisplayItemConfig>,
): DisplayItemConfig {
  return {
    type,
    label,
    category,
    format: "currency",
    order,
    sourceId,
    sourceField,
    color: options?.color ?? getCategoryColor(category),
    tooltip: options?.tooltip,
    highlight: options?.highlight,
  };
}

function getCategoryColor(category: DisplayCategory): string {
  const colors: Record<DisplayCategory, string> = {
    income: "#22c55e",
    pretax: "#a855f7",
    deduction: "#f59e0b",
    tax: "#ef4444",
    credit: "#14b8a6",
    summary: "#0d9488",
  };
  return colors[category];
}

export function buildDisplayItemsConfig(): DisplayItemConfig[] {
  const configs: DisplayItemConfig[] = [];
  let order = 100;

  for (const cfg of INCOME_KIND_CONFIGS) {
    configs.push(makeDisplayItemConfig(
      cfg.id.replace(" ", "-").toLowerCase(),
      cfg.label,
      "income",
      order++,
      "income-aggregation",
      cfg.aggregationField,
    ));
  }
  configs.push(makeDisplayItemConfig("total-income", "Total Income", "income", order++, "income-aggregation", "amount", { tooltip: "Gross income from all sources", color: "#166534" }));

  for (const cfg of PRETAX_BENEFIT_CONFIGS) {
    const type = cfg.id === "401k" ? "401k" : cfg.id === "hsa" ? "hsa" : cfg.id === "traditionalIra" ? "traditional-ira" : cfg.id;
    configs.push(makeDisplayItemConfig(
      type,
      cfg.label,
      "pretax",
      order++,
      "pretax-benefits",
      cfg.aggregationField,
    ));
  }
  configs.push(makeDisplayItemConfig("total-pretax", "Total Pre-tax", "pretax", order++, "pretax-benefits", "amount", { tooltip: "Total pre-tax deductions", color: "#7e22ce" }));
  configs.push(makeDisplayItemConfig("wages-after-pretax", "Wages After Pre-tax", "pretax", order++, "pretax-benefits", "wagesAfterPretax", { tooltip: "Wages after pre-tax deductions", color: "#9333ea" }));

  configs.push(makeDisplayItemConfig("standard-deduction", "Standard Deduction", "deduction", order++, "deduction-calculation", "standardDeduction"));
  configs.push(makeDisplayItemConfig("itemized-deductions", "Itemized Deductions", "deduction", order++, "deduction-calculation", "itemizedDeductions"));
  configs.push(makeDisplayItemConfig("deduction-used", "Deduction Used", "deduction", order++, "deduction-calculation", "amount", { tooltip: "Higher of standard or itemized", color: "#d97706" }));

  configs.push(makeDisplayItemConfig("ordinary-taxable-income", "Ordinary Taxable Income", "tax", order++, "federal-ordinary-tax", "ordinaryTaxableIncome"));
  configs.push(makeDisplayItemConfig("ltcg-taxable-income", "LTCG Taxable Income", "tax", order++, "federal-ltcg-tax", "longTermTaxableIncome"));
  configs.push(makeDisplayItemConfig("federal-ordinary-tax", "Federal Ordinary Tax", "tax", order++, "federal-ordinary-tax", "amount", { tooltip: "Federal income tax on ordinary income" }));
  configs.push(makeDisplayItemConfig("federal-ltcg-tax", "Federal LTCG Tax", "tax", order++, "federal-ltcg-tax", "amount", { tooltip: "Federal tax on long-term capital gains" }));
  configs.push(makeDisplayItemConfig("federal-niit", "Net Investment Income Tax", "tax", order++, "federal-niit", "amount", { tooltip: "3.8% NIIT on investment income" }));
  configs.push(makeDisplayItemConfig("federal-income-tax", "Federal Income Tax", "tax", order++, "combined-federal", "taxBeforeCredits", { tooltip: "Total federal income tax before credits", color: "#dc2626" }));
  configs.push(makeDisplayItemConfig("federal-income-tax-after-credits", "Federal Income Tax", "tax", order++, "combined-federal", "taxAfterCredits", { tooltip: "Federal income tax after credits", highlight: true, color: "#b91c1c" }));

  configs.push(makeDisplayItemConfig("social-security-tax", "Social Security Tax", "tax", order++, "payroll-tax", "socialSecurityTax", { color: "#3b82f6" }));
  configs.push(makeDisplayItemConfig("medicare-tax", "Medicare Tax", "tax", order++, "payroll-tax", "medicareTax", { color: "#3b82f6" }));
  configs.push(makeDisplayItemConfig("payroll-tax", "Payroll Taxes", "tax", order++, "payroll-tax", "amount", { tooltip: "Social Security and Medicare", color: "#1d4ed8" }));

  for (const cfg of FEDERAL_CREDIT_CONFIGS) {
    configs.push(makeDisplayItemConfig(
      `${cfg.id}-credit`,
      cfg.label,
      "credit",
      order++,
      "tax-credits",
      cfg.aggregationField,
      { color: "#14b8a6" },
    ));
  }

  configs.push(makeDisplayItemConfig("take-home-pay", "Take-Home Pay", "summary", order++, "take-home-calculation", "amount", { tooltip: "Income after all taxes and deductions", highlight: true }));
  configs.push(makeDisplayItemConfig("effective-tax-rate", "Effective Tax Rate", "summary", order++, "take-home-calculation", "effectiveRate", { format: "percent", tooltip: "Total tax / taxable income", highlight: true, color: "#0f766e" }));
  configs.push(makeDisplayItemConfig("marginal-tax-rate", "Marginal Tax Rate", "summary", order++, "take-home-calculation", "marginalRate", { format: "percent", tooltip: "Highest federal bracket", color: "#115e59" }));

  return configs;
}

export type TaxItemCalc<T extends TaxItemCategory = TaxItemCategory> = {
  id: string;
  category: T;
  label: string;
  description?: string;
  displayOrder: number;
  calcFn: (
    inputs: TaxCalculationInputs,
    state: TaxCalculationState,
    config: TaxYearConfig,
  ) => TaxItemResult;
  dependencies: string[];
  outputs: TaxItemOutput[];
  enabled: boolean;
};

export type DisplayCategory = "income" | "pretax" | "deduction" | "tax" | "credit" | "summary";

export type DisplayItemFormat = "currency" | "percent" | "number";

export type DisplayItem = {
  type: string;
  amount: number;
  label: string;
  category: DisplayCategory;
  color?: string;
  format: DisplayItemFormat;
  order: number;
  tooltip?: string;
  highlight?: boolean;
};

export type DisplayItemConfig = {
  type: string;
  label: string;
  category: DisplayCategory;
  color?: string;
  format: DisplayItemFormat;
  order: number;
  tooltip?: string;
  highlight?: boolean;
  sourceId: string;
  sourceField: string;
  defaultAmount?: number;
};

import type { YearValues, FilingStatus, ValidationContext, ValidationResult } from "./types";

export type { YearValues, FilingStatus, ValidationContext, ValidationResult } from "./types";
export type { TaxItemCategory };

function aggregateIncome(
  inputs: TaxCalculationInputs,
  _state: TaxCalculationState,
): TaxItemResult {
  const aggregated: Record<string, number> = {};
  for (const cfg of INCOME_KIND_CONFIGS) {
    aggregated[cfg.aggregationField] = 0;
  }

  for (const src of inputs.incomeSources) {
    const cfg = INCOME_KIND_CONFIGS.find(c => c.id === src.kind);
    if (cfg) {
      aggregated[cfg.aggregationField] += src.amount;
    }
  }

  let totalIncome = 0;
  for (const amount of Object.values(aggregated)) {
    totalIncome += amount;
  }

  const metadata: Record<string, unknown> = { ...aggregated, sources: inputs.incomeSources, totalIncome };
  return {
    id: "income-aggregation",
    label: "Total Income",
    amount: totalIncome,
    category: "income",
    metadata,
  };
}

function calculatePretaxBenefits(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const joint = inputs.filingStatus === "marriedJoint";
  const limits = config.pretaxLimits;

  const aggregated: Record<string, { spouse1: number; spouse2: number }> = {};
  for (const cfg of PRETAX_BENEFIT_CONFIGS) {
    aggregated[cfg.aggregationField] = { spouse1: 0, spouse2: 0 };
  }

  for (const src of inputs.pretaxBenefitSources) {
    const cfg = PRETAX_BENEFIT_CONFIGS.find(c => c.id === src.kind);
    if (!cfg) continue;

    const isSpouse2 = src.id.includes("spouse2");
    if (cfg.isSpouseSpecific) {
      aggregated[cfg.aggregationField][isSpouse2 ? "spouse2" : "spouse1"] += src.amount;
    } else {
      aggregated[cfg.aggregationField].spouse1 += src.amount;
    }
  }

  const metadata: Record<string, number | Record<string, number>> = {};
  let totalPretax = 0;
  let totalIra = 0;

  for (const cfg of PRETAX_BENEFIT_CONFIGS) {
    const agg = aggregated[cfg.aggregationField];
    const limit = cfg.limitKey ? limits[cfg.limitKey!] : (cfg.limitFn ? cfg.limitFn(limits, joint) : undefined);

    const effective1 = limit !== undefined ? Math.min(agg.spouse1, limit) : agg.spouse1;
    const effective2 = cfg.isSpouseSpecific && limit !== undefined ? Math.min(agg.spouse2, limit) : agg.spouse2;

    const effective = effective1 + effective2;
    metadata[cfg.aggregationField] = effective;
    metadata[`${cfg.aggregationField}Spouse1`] = effective1;
    if (cfg.isSpouseSpecific) {
      metadata[`${cfg.aggregationField}Spouse2`] = effective2;
    }

    if (cfg.id === "traditionalIra") {
      totalIra += effective;
    } else {
      totalPretax += effective;
    }
  }

  metadata.totalPretax = totalPretax;
  metadata.traditionalIra = totalIra;

  const incomeResult = state.results.get("income-aggregation");
  const wageIncome = (incomeResult?.metadata?.wageIncome as number) ?? 0;
  const wagesAfterPretax = Math.max(0, wageIncome - totalPretax - totalIra);
  metadata.wagesAfterPretax = wagesAfterPretax;

  return {
    id: "pretax-benefits",
    label: "Pre-tax Benefits",
    amount: totalPretax,
    category: "pretax",
    metadata,
  };
}

function calculateDeduction(
  inputs: TaxCalculationInputs,
  _state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const standardDeduction = config.standardDeduction[inputs.filingStatus];
  
  const itemizedAggregated: Record<string, number> = {};
  for (const cfg of DEDUCTION_KIND_CONFIGS) {
    itemizedAggregated[cfg.aggregationField] = 0;
  }

  for (const ded of inputs.itemizedDeductions) {
    const cfg = DEDUCTION_KIND_CONFIGS.find(c => c.id === ded.kind);
    if (cfg) {
      itemizedAggregated[cfg.aggregationField] += ded.amount;
    }
  }

  let itemizedDeductions = 0;
  for (const amount of Object.values(itemizedAggregated)) {
    itemizedDeductions += amount;
  }

  const useItemized = inputs.useItemizedDeductions && itemizedDeductions > standardDeduction;
  const deductionAmount = useItemized ? itemizedDeductions : standardDeduction;

  return {
    id: "deduction-calculation",
    label: useItemized ? "Itemized Deductions" : "Standard Deduction",
    amount: deductionAmount,
    category: "deduction",
    metadata: {
      kind: useItemized ? "itemized" : "standard",
      standardDeduction,
      itemizedDeductions,
      ...itemizedAggregated,
    },
  };
}

function calculateFederalOrdinaryTax(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const incomeResult = state.results.get("income-aggregation");
  const pretaxResult = state.results.get("pretax-benefits");
  const deductionResult = state.results.get("deduction-calculation");

  const wageIncome = (incomeResult?.metadata?.wageIncome as number) ?? 0;
  const ordinaryIncome = (incomeResult?.metadata?.ordinaryIncome as number) ?? 0;
  const shortTermCapGains = (incomeResult?.metadata?.shortTermCapGains as number) ?? 0;
  const preTaxTotal = pretaxResult?.amount ?? 0;
  const deductionAmount = deductionResult?.amount ?? 0;

  const ordinaryAfterPretax = wageIncome + ordinaryIncome + shortTermCapGains - preTaxTotal;
  const ordinaryTaxableIncome = Math.max(0, ordinaryAfterPretax - deductionAmount);

  const brackets = config.federalBrackets[inputs.filingStatus];
  const { tax: totalTax, marginalRate, segments } = calculateBracketTax(ordinaryTaxableIncome, brackets);

  const formattedSegments = segments.map(s => ({
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
    metadata: {
      ordinaryTaxableIncome,
      marginalRate,
      segments: formattedSegments,
    },
  };
}

function calculateFederalLtcgTax(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const incomeResult = state.results.get("income-aggregation");
  const deductionResult = state.results.get("deduction-calculation");

  const longTermCapGains = (incomeResult?.metadata?.longTermCapGains as number) ?? 0;
  const deductionAmount = deductionResult?.amount ?? 0;
  const ordinaryTaxableIncome = ((state.results.get("federal-ordinary-tax")?.metadata?.ordinaryTaxableIncome as number) ?? 0);

  const remainingDeduction = Math.max(0, deductionAmount - ordinaryTaxableIncome);
  const longTermTaxableIncome = Math.max(0, longTermCapGains - remainingDeduction);

  const ltcgThresholds = config.longTermCapGains[inputs.filingStatus];
  const { tax: totalTax, segments } = calculateLtcgTax(longTermTaxableIncome, ltcgThresholds, ordinaryTaxableIncome);

  return {
    id: "federal-ltcg-tax",
    label: "Federal Long-Term Capital Gains Tax",
    amount: totalTax,
    category: "tax",
    metadata: {
      longTermTaxableIncome,
      longTermCapGains,
      segments,
    },
  };
}

function calculateFederalNiit(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const incomeResult = state.results.get("income-aggregation");
  const ltcgResult = state.results.get("federal-ltcg-tax");

  const wageIncome = (incomeResult?.metadata?.wageIncome as number) ?? 0;
  const ordinaryIncome = (incomeResult?.metadata?.ordinaryIncome as number) ?? 0;
  const shortTermCapGains = (incomeResult?.metadata?.shortTermCapGains as number) ?? 0;
  const longTermTaxableIncome = (ltcgResult?.metadata?.longTermTaxableIncome as number) ?? 0;

  const magi = wageIncome + ordinaryIncome + shortTermCapGains + ((incomeResult?.metadata?.longTermCapGains as number) ?? 0);
  const netInvestmentIncome = shortTermCapGains + longTermTaxableIncome;
  const threshold = config.niit.magiThreshold[inputs.filingStatus];

  const magiOverThreshold = Math.max(0, magi - threshold);
  const niitAmount = netInvestmentIncome > 0 && magiOverThreshold > 0
    ? Math.min(netInvestmentIncome, magiOverThreshold) * config.niit.rate
    : 0;

  return {
    id: "federal-niit",
    label: "Federal Net Investment Income Tax",
    amount: niitAmount,
    category: "tax",
    metadata: {
      netInvestmentIncome,
      magi,
      magiOverThreshold,
    },
  };
}

function calculateTaxCredits(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
  _config: TaxYearConfig,
): TaxItemResult {
  const ordinaryTax = state.results.get("federal-ordinary-tax");
  const ltcgTax = state.results.get("federal-ltcg-tax");
  const niit = state.results.get("federal-niit");

  const totalTaxLiability = (ordinaryTax?.amount ?? 0) + (ltcgTax?.amount ?? 0) + (niit?.amount ?? 0);

  const creditsAggregated: Record<string, number> = {};
  for (const cfg of FEDERAL_CREDIT_CONFIGS) {
    creditsAggregated[cfg.aggregationField] = 0;
  }

  for (const credit of inputs.federalTaxCredits) {
    const cfg = FEDERAL_CREDIT_CONFIGS.find(c => c.id === credit.kind);
    if (cfg) {
      creditsAggregated[cfg.aggregationField] += credit.amount;
    }
  }

  let creditsEntered = 0;
  for (const amount of Object.values(creditsAggregated)) {
    creditsEntered += amount;
  }

  const creditsApplied = Math.min(creditsEntered, totalTaxLiability);

  return {
    id: "tax-credits",
    label: "Federal Tax Credits",
    amount: creditsApplied,
    category: "credit",
    metadata: {
      creditsEntered,
      creditsApplied,
      totalTaxLiability,
      ...creditsAggregated,
    },
  };
}

function calculatePayrollTax(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const incomeResult = state.results.get("income-aggregation");
  const pretaxResult = state.results.get("pretax-benefits");

  const wageIncome = (incomeResult?.metadata?.wageIncome as number) ?? 0;
  const preTaxTotal = pretaxResult?.amount ?? 0;
  const wagesForPayroll = Math.max(0, wageIncome - preTaxTotal);

  const wageBase = config.payroll.socialSecurityWageBase;
  const socialSecurityTax = Math.min(wagesForPayroll, wageBase) * config.payroll.socialSecurityRate;
  const medicareTaxBase = wagesForPayroll * config.payroll.medicareRate;
  const additionalMedicareThreshold = config.payroll.additionalMedicareThreshold[inputs.filingStatus];
  const additionalMedicare = wagesForPayroll > additionalMedicareThreshold
    ? (wagesForPayroll - additionalMedicareThreshold) * config.payroll.additionalMedicareRate
    : 0;
  const medicareTax = medicareTaxBase + additionalMedicare;

  const totalPayrollTax = socialSecurityTax + medicareTax;

  return {
    id: "payroll-tax",
    label: "Payroll Taxes",
    amount: totalPayrollTax,
    category: "tax",
    metadata: {
      socialSecurityTax,
      medicareTax,
      additionalMedicare,
      wagesForPayroll,
    },
  };
}

function calculateTakeHome(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
): TaxItemResult {
  const incomeResult = state.results.get("income-aggregation");
  const pretaxResult = state.results.get("pretax-benefits");
  const ordinaryTax = state.results.get("federal-ordinary-tax");
  const ltcgTax = state.results.get("federal-ltcg-tax");
  const niit = state.results.get("federal-niit");
  const credits = state.results.get("tax-credits");
  const payrollTax = state.results.get("payroll-tax");
  const selfEmploymentTaxResult = state.results.get("self-employment-tax");

  const totalIncome = incomeResult?.amount ?? 0;
  const preTaxTotal = pretaxResult?.amount ?? 0;
  const pretaxIra = (pretaxResult?.metadata?.traditionalIra as number) ?? 0;
  const federalTax = ((ordinaryTax?.amount ?? 0) + (ltcgTax?.amount ?? 0) + (niit?.amount ?? 0)) - (credits?.amount ?? 0);
  const payroll = payrollTax?.amount ?? 0;
  const selfEmploymentTax = selfEmploymentTaxResult?.amount ?? 0;

  const wagesAfterPretax = Math.max(0, totalIncome - preTaxTotal - pretaxIra);
  const takeHome = Math.max(0, totalIncome - preTaxTotal - federalTax - payroll - selfEmploymentTax - pretaxIra);

  const effectiveRateDenominator = Math.max(0, totalIncome - preTaxTotal - pretaxIra);
  const totalTax = federalTax + payroll + selfEmploymentTax;
  const effectiveRate = effectiveRateDenominator > 0 ? totalTax / effectiveRateDenominator : 0;

  return {
    id: "take-home-calculation",
    label: "Take-Home Pay",
    amount: takeHome,
    category: "income",
    metadata: {
      effectiveRate,
      totalIncome,
      preTaxTotal,
      federalTax,
      payrollTax: payroll,
      pretaxIra,
      wagesAfterPretax,
      selfEmploymentTax,
      totalTax,
    },
  };
}

export const TAX_ITEM_CALCS: TaxItemCalc[] = [
  {
    id: "income-aggregation",
    label: "Income Aggregation",
    description: "Aggregates all income sources into total income",
    category: "income",
    displayOrder: 1,
    calcFn: aggregateIncome,
    dependencies: [],
    outputs: [
      { key: "totalIncome", type: "currency", label: "Total Income", chartCategory: "income" },
      { key: "wageIncome", type: "currency", label: "Wage Income" },
      { key: "ordinaryIncome", type: "currency", label: "Ordinary Income" },
      { key: "shortTermCapGains", type: "currency", label: "Short-term Cap Gains" },
      { key: "longTermCapGains", type: "currency", label: "Long-term Cap Gains", sankeyNodeKind: "incomeSource", chartCategory: "income" },
    ],
    enabled: true,
  },
  {
    id: "pretax-benefits",
    label: "Pre-tax Benefits",
    description: "Calculates effective 401(k), HSA, and other pre-tax amounts",
    category: "pretax",
    displayOrder: 2,
    calcFn: calculatePretaxBenefits,
    dependencies: ["income-aggregation"],
    outputs: [
      { key: "preTaxTotal", type: "currency", label: "Payroll pre-tax", sankeyNodeKind: "pretaxContribution", chartCategory: "income" },
      { key: "preTax401k", type: "currency", label: "401(k) Deferrals" },
      { key: "preTaxHsa", type: "currency", label: "HSA (payroll)" },
      { key: "preTaxOther", type: "currency", label: "Other Pre-tax" },
      { key: "traditionalIra", type: "currency", label: "Traditional IRA" },
    ],
    enabled: true,
  },
  {
    id: "deduction-calculation",
    label: "Deduction Calculation",
    description: "Determines and calculates the applicable deduction",
    category: "deduction",
    displayOrder: 3,
    calcFn: calculateDeduction,
    dependencies: ["income-aggregation", "pretax-benefits"],
    outputs: [
      { key: "deductionAmount", type: "currency", label: "Deduction Used", sankeyNodeKind: "deduction", chartCategory: "deduction" },
      { key: "deductionKind", type: "number", label: "Deduction Type" },
      { key: "standardDeduction", type: "currency", label: "Standard Deduction", sankeyNodeKind: "standardDeduction", chartCategory: "deduction" },
    ],
    enabled: true,
  },
  {
    id: "federal-ordinary-tax",
    label: "Federal Ordinary Income Tax",
    description: "Calculates federal tax on ordinary income using brackets",
    category: "tax",
    displayOrder: 4,
    calcFn: calculateFederalOrdinaryTax,
    dependencies: ["deduction-calculation"],
    outputs: [
      { key: "federalOrdinaryIncomeTax", type: "currency", label: "Federal Ordinary Income Tax", sankeyNodeKind: "ordinaryBracket", chartCategory: "tax" },
      { key: "ordinaryTaxableIncome", type: "currency", label: "Ordinary Taxable Income", sankeyNodeKind: "ordinaryTaxableIncome", chartCategory: "income" },
    ],
    enabled: true,
  },
  {
    id: "federal-ltcg-tax",
    label: "Federal Long-Term Capital Gains Tax",
    description: "Calculates federal tax on long-term capital gains",
    category: "tax",
    displayOrder: 5,
    calcFn: calculateFederalLtcgTax,
    dependencies: ["deduction-calculation", "federal-ordinary-tax"],
    outputs: [
      { key: "federalLongTermCapGainsTax", type: "currency", label: "Federal LTCG Tax", sankeyNodeKind: "ltcgBracket", chartCategory: "tax" },
      { key: "longTermTaxableIncome", type: "currency", label: "LTCG Taxable Income", sankeyNodeKind: "longTermTaxableIncome", chartCategory: "income", showWhen: (s) => ((s.results.get("income-aggregation")?.metadata as { longTermCapGains?: number })?.longTermCapGains ?? 0) > 0 },
    ],
    enabled: true,
  },
  {
    id: "federal-niit",
    label: "Federal Net Investment Income Tax",
    description: "Calculates 3.8% NIIT on net investment income",
    category: "tax",
    displayOrder: 6,
    calcFn: calculateFederalNiit,
    dependencies: ["federal-ordinary-tax", "federal-ltcg-tax"],
    outputs: [
      { key: "federalNetInvestmentIncomeTax", type: "currency", label: "Net Investment Income Tax", showWhen: (s) => ((s.results.get("federal-niit")?.amount ?? 0) as number) > 0 },
      { key: "netInvestmentIncome", type: "currency", label: "Net Investment Income" },
    ],
    enabled: true,
  },
  {
    id: "tax-credits",
    label: "Tax Credits",
    description: "Applies nonrefundable tax credits against tax liability",
    category: "credit",
    displayOrder: 7,
    calcFn: calculateTaxCredits,
    dependencies: ["federal-ordinary-tax", "federal-ltcg-tax", "federal-niit"],
    outputs: [
      { key: "federalTaxCreditsApplied", type: "currency", label: "Federal Credits Applied", sankeyNodeKind: "federalCredits", chartCategory: "tax" },
      { key: "federalTaxCredits", type: "currency", label: "Federal Credits Entered" },
    ],
    enabled: true,
  },
  {
    id: "payroll-tax",
    label: "Payroll Taxes",
    description: "Calculates Social Security and Medicare taxes",
    category: "tax",
    displayOrder: 8,
    calcFn: calculatePayrollTax,
    dependencies: ["income-aggregation"],
    outputs: [
      { key: "payrollTax", type: "currency", label: "Payroll Taxes", sankeyNodeKind: "taxesPayroll", chartCategory: "tax" },
      { key: "socialSecurityTax", type: "currency", label: "Social Security Tax" },
      { key: "medicareTax", type: "currency", label: "Medicare Tax" },
    ],
    enabled: true,
  },
  {
    id: "self-employment-tax",
    label: "Self-Employment Tax",
    description: "Calculates self-employment tax (Social Security and Medicare) on 1099 income",
    category: "tax",
    displayOrder: 8.5,
    calcFn: calculateSelfEmploymentTax,
    dependencies: ["income-aggregation"],
    outputs: [
      { key: "selfEmploymentTax", type: "currency", label: "Self-Employment Tax" },
      { key: "netEarnings", type: "currency", label: "Net Earnings (92.35%)" },
    ],
    enabled: true,
  },
  {
    id: "take-home-calculation",
    label: "Take-Home Calculation",
    description: "Calculates final take-home pay after all taxes and deductions",
    category: "income",
    displayOrder: 9,
    calcFn: calculateTakeHome,
    dependencies: ["income-aggregation", "pretax-benefits", "tax-credits", "payroll-tax", "self-employment-tax"],
    outputs: [
      { key: "takeHomePay", type: "currency", label: "Take-Home Pay", sankeyNodeKind: "keep", chartCategory: "keep", highlight: true },
      { key: "effectiveTaxRate", type: "percent", label: "Effective Tax Rate", highlight: true },
    ],
    enabled: true,
  },
];

export function getTaxItemCalc(id: string): TaxItemCalc | undefined {
  return TAX_ITEM_CALCS.find(item => item.id === id);
}

export function getEnabledTaxItemCalcs(): TaxItemCalc[] {
  return TAX_ITEM_CALCS.filter(item => item.enabled);
}

export function getTaxItemCalcsByCategory(category: TaxItemCategory): TaxItemCalc[] {
  return TAX_ITEM_CALCS.filter(item => item.category === category);
}

export type FormInputItem = {
  id: string;
  category: "income" | "pretax" | "deduction" | "credit";
  label: string;
  shortLabel?: string;
  description?: string;
  displayOrder: number;
  inputType: "currency" | "text";
  allowMultiple: boolean;
  defaultAmount?: number;
  defaultLabel?: string;
  getLimit?: (yearValues: YearValues) => number;
  getFilingStatusLimit?: (yearValues: YearValues, filingStatus: FilingStatus) => number;
  validate?: (value: number, ctx: ValidationContext) => ValidationResult;
  showWhen?: (ctx: { filingStatus: FilingStatus; taxYear: number; isJoint?: boolean }) => boolean;
  getSpouseLabels?: (isJoint: boolean) => { single: string; joint: string; spouse1?: string; spouse2?: string };
};

export type PretaxBenefitConfig = {
  id: string;
  label: string;
  limitKey?: keyof TaxYearConfig["pretaxLimits"];
  limitFn?: (limits: TaxYearConfig["pretaxLimits"], joint: boolean) => number;
  isSpouseSpecific: boolean;
  aggregationField: string;
};

export const PRETAX_BENEFIT_CONFIGS: PretaxBenefitConfig[] = [
  { id: "401k", label: "401(k) Deferrals", limitKey: "electiveDeferral401k", isSpouseSpecific: true, aggregationField: "401k" },
  { id: "hsa", label: "HSA Contributions", limitFn: (limits, joint) => joint ? limits.hsaFamily : limits.hsaSelfOnly, isSpouseSpecific: true, aggregationField: "hsa" },
  { id: "traditionalIra", label: "Traditional IRA", limitKey: "traditionalIraContribution", isSpouseSpecific: true, aggregationField: "ira" },
  { id: "other", label: "Other Pre-tax", isSpouseSpecific: false, aggregationField: "other" },
];

export function getPretaxBenefitKindValues(): string[] {
  const kinds: string[] = [];
  for (const cfg of PRETAX_BENEFIT_CONFIGS) {
    if (cfg.isSpouseSpecific) {
      kinds.push(`preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}Spouse1`);
      kinds.push(`preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}Spouse2`);
    } else {
      kinds.push(`preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}`);
    }
  }
  return kinds;
}

export function getPretaxBenefitConfig(id: string): PretaxBenefitConfig | undefined {
  return PRETAX_BENEFIT_CONFIGS.find(c => c.id === id);
}

export function getPretaxLimit(configId: string, limits: TaxYearConfig["pretaxLimits"], joint: boolean): number | undefined {
  const cfg = getPretaxBenefitConfig(configId);
  if (!cfg) return undefined;
  if (cfg.limitKey) return limits[cfg.limitKey];
  if (cfg.limitFn) return cfg.limitFn(limits, joint);
  return undefined;
}

export const FORM_INCOME_ITEMS: FormInputItem[] = [
  { id: "wages", category: "income", label: "W-2 Wages", shortLabel: "Wages", description: "Wages reported on Form W-2", displayOrder: 1, inputType: "currency", allowMultiple: false },
  { id: "selfEmployment", category: "income", label: "1099 Self-Employment", shortLabel: "1099 Income", description: "Self-employment income (net of expenses)", displayOrder: 2, inputType: "currency", allowMultiple: false },
  { id: "shortTermCapGains", category: "income", label: "Short-Term Capital Gains", shortLabel: "STCG", description: "Capital gains held one year or less", displayOrder: 3, inputType: "currency", allowMultiple: false },
  { id: "longTermCapGains", category: "income", label: "Long-Term Capital Gains", shortLabel: "LTCG", description: "Capital gains held longer than one year", displayOrder: 4, inputType: "currency", allowMultiple: false },
  { id: "ordinary", category: "income", label: "Other Ordinary Income", shortLabel: "Other Income", description: "Other ordinary income (rent, royalties, etc.)", displayOrder: 5, inputType: "currency", allowMultiple: false },
];

export const FORM_PRETAX_ITEMS: FormInputItem[] = [
  { id: "401k", category: "pretax", label: "401(k) Deferrals", shortLabel: "401(k)", description: "Elective deferrals from W-2 pay", displayOrder: 1, inputType: "currency", allowMultiple: false, getSpouseLabels: (isJoint) => ({ single: "401(k) deferrals", joint: "401(k) deferrals — Spouse 1", spouse1: "401(k) — Spouse 1", spouse2: "401(k) — Spouse 2" }) },
  { id: "hsa", category: "pretax", label: "HSA (payroll)", shortLabel: "HSA", description: "Payroll HSA contributions", displayOrder: 2, inputType: "currency", allowMultiple: false, getSpouseLabels: (isJoint) => ({ single: "HSA (payroll)", joint: "HSA (payroll) — Spouse 1", spouse1: "HSA — Spouse 1", spouse2: "HSA — Spouse 2" }) },
  { id: "other", category: "pretax", label: "Other Pre-tax (payroll)", shortLabel: "Other Pre-tax", description: "Miscellaneous payroll amounts taken pre-tax", displayOrder: 3, inputType: "currency", allowMultiple: false },
  { id: "traditionalIra", category: "pretax", label: "Traditional IRA (deductible)", shortLabel: "Traditional IRA", description: "Traditional IRA (deductible)", displayOrder: 4, inputType: "currency", allowMultiple: false, getSpouseLabels: (isJoint) => ({ single: "Traditional IRA (deductible)", joint: "Traditional IRA — Spouse 1", spouse1: "Traditional IRA — Spouse 1", spouse2: "Traditional IRA — Spouse 2" }) },
];

export const FORM_DEDUCTION_ITEMS: FormInputItem[] = [
  { id: "standard", category: "deduction", label: "Standard Deduction", shortLabel: "Standard", description: "Standard deduction based on filing status", displayOrder: 1, inputType: "currency", allowMultiple: false },
  { id: "salt", category: "deduction", label: "State & Local Taxes (SALT)", shortLabel: "SALT", description: "State and local taxes you elect to deduct", displayOrder: 2, inputType: "currency", allowMultiple: false },
  { id: "medicalDental", category: "deduction", label: "Medical & Dental", shortLabel: "Medical", description: "Medical and dental expenses", displayOrder: 3, inputType: "currency", allowMultiple: false },
  { id: "mortgageInterest", category: "deduction", label: "Home Mortgage Interest", shortLabel: "Mortgage", description: "Home mortgage interest", displayOrder: 4, inputType: "currency", allowMultiple: false },
  { id: "charitable", category: "deduction", label: "Charitable Contributions", shortLabel: "Charity", description: "Cash and non-cash contributions to qualified charities", displayOrder: 5, inputType: "currency", allowMultiple: false },
];

export const FORM_CREDIT_ITEMS: FormInputItem[] = [
  { id: "childTaxCredit", category: "credit", label: "Child Tax Credit", shortLabel: "CTC", description: "Credit for qualifying children", displayOrder: 1, inputType: "currency", allowMultiple: false },
  { id: "educationCredits", category: "credit", label: "Education Credits", shortLabel: "Education", description: "American opportunity credit and/or lifetime learning credit", displayOrder: 2, inputType: "currency", allowMultiple: false },
  { id: "retirementSavingsContributions", category: "credit", label: "Retirement Savings Contributions (Saver's Credit)", shortLabel: "Saver's Credit", description: "Saver's credit for eligible retirement contributions", displayOrder: 3, inputType: "currency", allowMultiple: false },
  { id: "other", category: "credit", label: "Other Federal Credit", shortLabel: "Other", description: "Any other federal income tax credit", displayOrder: 4, inputType: "currency", allowMultiple: false },
];

export const ALL_FORM_ITEMS: FormInputItem[] = [
  ...FORM_INCOME_ITEMS,
  ...FORM_PRETAX_ITEMS,
  ...FORM_DEDUCTION_ITEMS,
  ...FORM_CREDIT_ITEMS,
];

export function getFormItemsByCategory(category: FormInputItem["category"]): FormInputItem[] {
  return ALL_FORM_ITEMS.filter(item => item.category === category);
}

export const DISPLAY_ITEMS_CONFIG: DisplayItemConfig[] = buildDisplayItemsConfig();

function getResultById(results: Map<string, TaxItemResult>, sourceId: string): TaxItemResult | undefined {
  return results.get(sourceId);
}

function extractFieldFromResult(result: TaxItemResult | undefined, field: string): number {
  if (!result) return 0;
  if (field === "amount") return result.amount;
  return (result.metadata?.[field] as number) ?? 0;
}

export function buildDisplayItems(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
): DisplayItem[] {
  const results = state.results;
  const displayItems: DisplayItem[] = [];

  const ordinaryTax = results.get("federal-ordinary-tax") as TaxItemResult | undefined;
  const ltcgTax = results.get("federal-ltcg-tax") as TaxItemResult | undefined;
  const niit = results.get("federal-niit") as TaxItemResult | undefined;
  const credits = results.get("tax-credits") as TaxItemResult | undefined;

  const taxBeforeCredits = ((ordinaryTax?.amount ?? 0) + (ltcgTax?.amount ?? 0) + (niit?.amount ?? 0));
  const taxAfterCredits = Math.max(0, taxBeforeCredits - (credits?.amount ?? 0));

  const taxSegments = ordinaryTax?.metadata?.segments as Array<{ marginalRate: number }> | undefined;
  const marginalRate = taxSegments?.slice(-1)?.[0]?.marginalRate ?? 0;

  for (const config of DISPLAY_ITEMS_CONFIG) {
    let amount = 0;
    
    if (config.sourceId === "combined-federal") {
      if (config.sourceField === "taxBeforeCredits") {
        amount = taxBeforeCredits;
      } else if (config.sourceField === "taxAfterCredits") {
        amount = taxAfterCredits;
      }
    } else if (config.sourceId === "take-home-calculation" && config.sourceField === "marginalRate") {
      amount = marginalRate;
    } else if (config.sourceId === "pretax-benefits" && config.sourceField === "wagesAfterPretax") {
      const pretaxResult = results.get("pretax-benefits") as TaxItemResult | undefined;
      amount = (pretaxResult?.metadata?.wagesAfterPretax as number) ?? 0;
    } else {
      const result = getResultById(results, config.sourceId);
      amount = extractFieldFromResult(result, config.sourceField);
    }

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

export function getDisplayItemsByCategory(
  displayItems: DisplayItem[],
  category: DisplayCategory,
): DisplayItem[] {
  return displayItems.filter(item => item.category === category);
}

export const PRETAX_BENEFIT_KIND_VALUES = PRETAX_BENEFIT_CONFIGS.flatMap(cfg => {
  if (cfg.isSpouseSpecific) {
    return [
      `preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}Spouse1`,
      `preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}Spouse2`,
    ];
  }
  return [`preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}`];
});

export const ITEMIZED_DEDUCTION_KIND_VALUES = DEDUCTION_KIND_CONFIGS.map(cfg => cfg.id as string);

export const FEDERAL_TAX_CREDIT_KIND_VALUES = FEDERAL_CREDIT_CONFIGS.map(cfg => cfg.id as string);

export const INCOME_KIND_VALUES = INCOME_KIND_CONFIGS.map(cfg => cfg.id as string);