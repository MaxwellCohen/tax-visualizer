import type { TaxCalculationInputs, TaxCalculationState, TaxItemResult, TaxItemCategory } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";

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

import type { YearValues, FilingStatus, ValidationContext, ValidationResult } from "./types";

export type { YearValues, FilingStatus, ValidationContext, ValidationResult } from "./types";
export type { TaxItemCategory };

function aggregateIncome(
  inputs: TaxCalculationInputs,
  _state: TaxCalculationState,
): TaxItemResult {
  const wageIncome = inputs.incomeSources
    .filter((s) => s.kind === "wages")
    .reduce((sum, s) => sum + s.amount, 0);

  const ordinaryIncome = inputs.incomeSources
    .filter((s) => s.kind === "ordinary")
    .reduce((sum, s) => sum + s.amount, 0);

  const shortTermCapGains = inputs.incomeSources
    .filter((s) => s.kind === "shortTermCapGains")
    .reduce((sum, s) => sum + s.amount, 0);

  const longTermCapGains = inputs.incomeSources
    .filter((s) => s.kind === "longTermCapGains")
    .reduce((sum, s) => sum + s.amount, 0);

  const totalIncome = wageIncome + ordinaryIncome + shortTermCapGains + longTermCapGains;

  return {
    id: "income-aggregation",
    label: "Total Income",
    amount: totalIncome,
    category: "income",
    metadata: {
      wageIncome,
      ordinaryIncome,
      shortTermCapGains,
      longTermCapGains,
      sources: inputs.incomeSources,
    },
  };
}

function calculatePretaxBenefits(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const incomeResult = state.results.get("income-aggregation");
  const wageIncome = (incomeResult?.metadata?.wageIncome as number) ?? 0;

  const joint = inputs.filingStatus === "marriedJoint";

  const preTax401kSpouse1 = inputs.pretaxBenefitSources
    .filter((s) => s.kind === "401k" && s.id.includes("spouse1"))
    .reduce((sum, s) => sum + s.amount, 0);
  const preTax401kSpouse2 = inputs.pretaxBenefitSources
    .filter((s) => s.kind === "401k" && s.id.includes("spouse2"))
    .reduce((sum, s) => sum + s.amount, 0);

  const preTaxHsaSpouse1 = inputs.pretaxBenefitSources
    .filter((s) => s.kind === "hsa" && s.id.includes("spouse1"))
    .reduce((sum, s) => sum + s.amount, 0);
  const preTaxHsaSpouse2 = inputs.pretaxBenefitSources
    .filter((s) => s.kind === "hsa" && s.id.includes("spouse2"))
    .reduce((sum, s) => sum + s.amount, 0);

  const preTaxOther = inputs.pretaxBenefitSources
    .filter((s) => s.kind === "other")
    .reduce((sum, s) => sum + s.amount, 0);

  const traditionalIraSpouse1 = inputs.pretaxBenefitSources
    .filter((s) => s.kind === "traditionalIra" && s.id.includes("spouse1"))
    .reduce((sum, s) => sum + s.amount, 0);
  const traditionalIraSpouse2 = inputs.pretaxBenefitSources
    .filter((s) => s.kind === "traditionalIra" && s.id.includes("spouse2"))
    .reduce((sum, s) => sum + s.amount, 0);

  const limit401k = config.pretaxLimits.electiveDeferral401k;
  const effective401k1 = Math.min(preTax401kSpouse1, limit401k);
  const effective401k2 = Math.min(preTax401kSpouse2, limit401k);

  const limitHsa = joint ? config.pretaxLimits.hsaFamily : config.pretaxLimits.hsaSelfOnly;
  const effectiveHsa1 = Math.min(preTaxHsaSpouse1, limitHsa);
  const effectiveHsa2 = joint ? Math.min(preTaxHsaSpouse2, limitHsa) : 0;

  const totalPretax = effective401k1 + effective401k2 + effectiveHsa1 + effectiveHsa2 + preTaxOther;
  const totalIra = traditionalIraSpouse1 + traditionalIraSpouse2;

  return {
    id: "pretax-benefits",
    label: "Pre-tax Benefits",
    amount: totalPretax,
    category: "pretax",
    metadata: {
      effective401k: effective401k1 + effective401k2,
      effectiveHsa: effectiveHsa1 + effectiveHsa2,
      effectiveOther: preTaxOther,
      totalPretax,
      traditionalIra: totalIra,
      pretax401kSpouse1: effective401k1,
      pretax401kSpouse2: effective401k2,
      pretaxHsaSpouse1: effectiveHsa1,
      pretaxHsaSpouse2: effectiveHsa2,
      pretaxOther: preTaxOther,
    },
  };
}

function calculateDeduction(
  inputs: TaxCalculationInputs,
  state: TaxCalculationState,
  config: TaxYearConfig,
): TaxItemResult {
  const standardDeduction = config.standardDeduction[inputs.filingStatus];
  
  const itemizedDeductions = inputs.itemizedDeductions.reduce((sum, d) => sum + d.amount, 0);

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
  let remaining = ordinaryTaxableIncome;
  let lowerBound = 0;
  let totalTax = 0;
  const segments: Array<{ rangeStart: number; rangeEnd: number | null; incomeAmount: number; taxAmount: number; marginalRate: number }> = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
    const amountInBracket = Math.min(remaining, upperBound - lowerBound);
    if (amountInBracket > 0) {
      const taxAmount = amountInBracket * bracket.rate;
      totalTax += taxAmount;
      segments.push({
        rangeStart: lowerBound,
        rangeEnd: bracket.upTo,
        incomeAmount: amountInBracket,
        taxAmount,
        marginalRate: bracket.rate,
      });
      remaining -= amountInBracket;
    }
    lowerBound = upperBound;
  }

  return {
    id: "federal-ordinary-tax",
    label: "Federal Ordinary Income Tax",
    amount: totalTax,
    category: "tax",
    metadata: {
      ordinaryTaxableIncome,
      segments,
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
  const zeroRateMax = ltcgThresholds.zeroRateMax;
  const fifteenRateMax = ltcgThresholds.fifteenRateMax;

  let totalTax = 0;
  let remaining = longTermTaxableIncome;
  let lowerBound = ordinaryTaxableIncome;

  if (remaining > 0) {
    const inZeroRate = Math.max(0, Math.min(remaining, Math.max(0, zeroRateMax - lowerBound)));
    if (inZeroRate > 0) {
      totalTax += inZeroRate * 0;
      remaining -= inZeroRate;
      lowerBound += inZeroRate;
    }
  }

  if (remaining > 0) {
    const inFifteenRate = Math.max(0, Math.min(remaining, Math.max(0, fifteenRateMax - lowerBound)));
    if (inFifteenRate > 0) {
      totalTax += inFifteenRate * 0.15;
      remaining -= inFifteenRate;
      lowerBound += inFifteenRate;
    }
  }

  if (remaining > 0) {
    totalTax += remaining * 0.20;
  }

  return {
    id: "federal-ltcg-tax",
    label: "Federal Long-Term Capital Gains Tax",
    amount: totalTax,
    category: "tax",
    metadata: {
      longTermTaxableIncome,
      longTermCapGains,
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
  const threshold = config.payroll.additionalMedicareThreshold[inputs.filingStatus];

  const magiOverThreshold = Math.max(0, magi - threshold);
  const niitAmount = netInvestmentIncome > 0 && magiOverThreshold > 0
    ? Math.min(netInvestmentIncome, magiOverThreshold) * 0.038
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
): TaxItemResult {
  const ordinaryTax = state.results.get("federal-ordinary-tax");
  const ltcgTax = state.results.get("federal-ltcg-tax");
  const niit = state.results.get("federal-niit");

  const totalTaxLiability = (ordinaryTax?.amount ?? 0) + (ltcgTax?.amount ?? 0) + (niit?.amount ?? 0);
  const creditsEntered = inputs.federalTaxCredits.reduce((sum, c) => sum + c.amount, 0);
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

  const totalIncome = incomeResult?.amount ?? 0;
  const preTaxTotal = pretaxResult?.amount ?? 0;
  const pretaxIra = (pretaxResult?.metadata?.traditionalIra as number) ?? 0;
  const federalTax = ((ordinaryTax?.amount ?? 0) + (ltcgTax?.amount ?? 0) + (niit?.amount ?? 0)) - (credits?.amount ?? 0);
  const payroll = payrollTax?.amount ?? 0;

  const wagesAfterPretax = Math.max(0, totalIncome - preTaxTotal - pretaxIra);
  const takeHome = Math.max(0, totalIncome - preTaxTotal - federalTax - payroll - pretaxIra);

  const effectiveRateDenominator = Math.max(0, totalIncome - preTaxTotal - pretaxIra);
  const effectiveRate = effectiveRateDenominator > 0 ? (federalTax + payroll) / effectiveRateDenominator : 0;

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
    id: "take-home-calculation",
    label: "Take-Home Calculation",
    description: "Calculates final take-home pay after all taxes and deductions",
    category: "income",
    displayOrder: 9,
    calcFn: calculateTakeHome,
    dependencies: ["income-aggregation", "pretax-benefits", "tax-credits", "payroll-tax"],
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