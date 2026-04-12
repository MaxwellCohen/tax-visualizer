import { type TaxCalculationState, type TaxItemCategory } from "~/lib/taxConfig.types";
import type { DisplayCategory, DisplayItem } from "~/lib/taxForm.types";
import type { LtcgTaxSegment, PretaxBenefitKind } from "~/lib/taxCalc.types";
import type { TaxYearConfig } from "~/lib/taxData.types";

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

/** Display item `type` slug for an income kind (aligns with chart metrics registry `detailedDisplay.type`). */
function incomeKindIdToDisplayType(kindId: string): string {
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

const LTCG_BRACKET_CONFIGS: Array<{ rate: number; thresholdKey: "zeroRateMax" | "fifteenRateMax" | null }> = [
  { rate: 0, thresholdKey: "zeroRateMax" },
  { rate: 0.15, thresholdKey: "fifteenRateMax" },
  { rate: 0.20, thresholdKey: null },
];

export function calculateLtcgTax(
  taxableLtcg: number,
  thresholds: { zeroRateMax: number; fifteenRateMax: number },
  baseIncome: number,
): { tax: number; segments: LtcgTaxSegment[] } {
  const segments: LtcgTaxSegment[] = [];
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

export function calculateBracketTax(
  taxableIncome: number,
  brackets: Array<{ rate: number; upTo: number | null }>,
): { tax: number; marginalRate: number; segments: LtcgTaxSegment[] } {
  let remaining = taxableIncome;
  let lowerBound = 0;
  let totalTax = 0;
  const usedSegments: LtcgTaxSegment[] = [];

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

export type { DisplayCategory, DisplayItem, DisplayItemConfig, DisplayItemFormat } from "~/lib/taxForm.types";

export type TaxItemCalc<T extends TaxItemCategory = TaxItemCategory> = {
  id: string;
  category: T;
  label: string;
  description?: string;
  displayOrder: number;
  dependencies: string[];
  outputs: TaxItemOutput[];
  enabled: boolean;
};

import type { YearValues, FilingStatus, ValidationContext, ValidationResult } from "./types";

export type { YearValues, FilingStatus, ValidationContext, ValidationResult } from "./types";
export type { TaxItemCategory };


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

function getPretaxBenefitKindValues(): string[] {
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

function getPretaxBenefitConfig(id: string): PretaxBenefitConfig | undefined {
  return PRETAX_BENEFIT_CONFIGS.find(c => c.id === id);
}

function getPretaxLimit(configId: string, limits: TaxYearConfig["pretaxLimits"], joint: boolean): number | undefined {
  const cfg = getPretaxBenefitConfig(configId);
  if (!cfg) return undefined;
  if (cfg.limitKey) return limits[cfg.limitKey];
  if (cfg.limitFn) return cfg.limitFn(limits, joint);
  return undefined;
}

const FORM_INCOME_ITEMS: FormInputItem[] = [
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

const ALL_FORM_ITEMS: FormInputItem[] = [
  ...FORM_INCOME_ITEMS,
  ...FORM_PRETAX_ITEMS,
  ...FORM_DEDUCTION_ITEMS,
  ...FORM_CREDIT_ITEMS,
];

function getFormItemsByCategory(category: FormInputItem["category"]): FormInputItem[] {
  return ALL_FORM_ITEMS.filter(item => item.category === category);
}

function getDisplayItemsByCategory(
  displayItems: DisplayItem[],
  category: DisplayCategory,
): DisplayItem[] {
  return displayItems.filter(item => item.category === category);
}

const PRETAX_BENEFIT_KIND_VALUES = PRETAX_BENEFIT_CONFIGS.flatMap(cfg => {
  if (cfg.isSpouseSpecific) {
    return [
      `preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}Spouse1`,
      `preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}Spouse2`,
    ];
  }
  return [`preTax${cfg.id.charAt(0).toUpperCase() + cfg.id.slice(1)}`];
});

const ITEMIZED_DEDUCTION_KIND_VALUES = DEDUCTION_KIND_CONFIGS.map(cfg => cfg.id as string);

const FEDERAL_TAX_CREDIT_KIND_VALUES = FEDERAL_CREDIT_CONFIGS.map(cfg => cfg.id as string);

const INCOME_KIND_VALUES = INCOME_KIND_CONFIGS.map(cfg => cfg.id as string);