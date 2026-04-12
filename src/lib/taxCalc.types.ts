import type { FilingStatus } from "~/lib/taxData.types";

export type IncomeKind = "wages" | "ordinary" | "shortTermCapGains" | "longTermCapGains" | "selfEmployment";

export type TaxResultEntry = {
  kind: string;
  value: number;
  label?: string;
  category?: string;
  marginalRate?: number;
  rangeStart?: number;
  rangeEnd?: number | null;
};

export type TaxSegment = {
  id?: string;
  rangeStart: number;
  rangeEnd: number | null;
  incomeAmount: number;
  taxAmount: number;
  marginalRate: number;
};

export type IncomeSource = {
  id: string;
  kind: IncomeKind;
  label: string;
  amount: number;
};

export type PretaxBenefitKind = 
  | "preTax401kSpouse1"
  | "preTax403bSpouse1"
  | "preTax457bSpouse1"
  | "preTax401kSpouse2"
  | "preTax403bSpouse2"
  | "preTax457bSpouse2"
  | "preTaxHsaSpouse1"
  | "preTaxHsaSpouse2"
  | "preTaxOther"
  | "preTaxHealthFsaSpouse1"
  | "preTaxHealthFsaSpouse2"
  | "preTaxDependentCareFsaSpouse1"
  | "preTaxDependentCareFsaSpouse2"
  | "preTaxCommuterSpouse1"
  | "preTaxCommuterSpouse2"
  | "traditionalIraSpouse1"
  | "traditionalIraSpouse2";

export type PretaxBenefitSource = {
  id: string;
  kind: PretaxBenefitKind;
  label: string;
  amount: number;
};

export type ItemizedDeductionKind = 
  | "medicalDental"
  | "salt"
  | "mortgageInterest"
  | "investmentInterest"
  | "charitable"
  | "casualtyTheft"
  | "otherItemized";

export type ItemizedDeductionSource = {
  id: string;
  kind: ItemizedDeductionKind;
  label: string;
  amount: number;
};

export type FederalTaxCreditKind = 
  | "childTaxCredit"
  | "creditForOtherDependents"
  | "childAndDependentCare"
  | "educationCredits"
  | "retirementSavingsContributions"
  | "foreignTaxCredit"
  | "residentialCleanEnergy"
  | "electricVehicleCredit"
  | "generalBusinessCredit"
  | "otherFederalCredit";

export type FederalTaxCreditSource = {
  id: string;
  kind: FederalTaxCreditKind;
  label: string;
  amount: number;
};

export type DeductionKind = "standard" | "itemized";

export type TaxInput = {
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  pretaxBenefitSources: PretaxBenefitSource[];
  useItemizedDeductions: boolean;
  itemizedDeductions: ItemizedDeductionSource[];
  federalTaxCredits: FederalTaxCreditSource[];
};

export type TaxResult = {
  entries: TaxResultEntry[];
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  ordinaryFederalSegments: TaxSegment[];
  longTermCapitalGainsSegments: TaxSegment[];
  warnings: string[];
  notes: string[];
  get(kind: string): number | undefined;
  totalIncome: number;
  wageIncome: number;
  selfEmploymentIncome: number;
  ordinaryGrossIncome: number;
  shortTermCapGainsGrossIncome: number;
  longTermCapitalGainsGrossIncome: number;
  preTax401k: number;
  preTaxHsa: number;
  preTaxOther: number;
  preTaxTotal: number;
  traditionalIra: number;
  wagesAfterPretax: number;
  deductionKind: DeductionKind;
  standardDeduction: number;
  deductionAmount: number;
  deductionAllocatedToOrdinary: number;
  deductionAllocatedToLongTermGross: number;
  ordinaryTaxableIncome: number;
  longTermTaxableIncome: number;
  taxableIncome: number;
  federalOrdinaryIncomeTax: number;
  federalLongTermCapGainsTax: number;
  federalNetInvestmentIncomeTax: number;
  netInvestmentIncome: number;
  federalIncomeTaxBeforeCredits: number;
  federalTaxCredits: number;
  federalTaxCreditsApplied: number;
  federalIncomeTax: number;
  payrollTax: number;
  selfEmploymentTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  takeHomePay: number;
  effectiveTaxRate: number;
};

let incomeSourceSeq = 0;
let pretaxBenefitSeq = 0;
let itemizedDeductionSeq = 0;
let federalTaxCreditSeq = 0;

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${++incomeSourceSeq}`;
}

export function newIncomeSource(overrides?: Partial<Omit<IncomeSource, "id">>): IncomeSource {
  return {
    id: newId("inc"),
    kind: "wages",
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newPretaxBenefitSource(overrides?: Partial<Omit<PretaxBenefitSource, "id">>): PretaxBenefitSource {
  return {
    id: newId("ptx"),
    kind: "preTax401kSpouse1",
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newItemizedDeductionSource(overrides?: Partial<Omit<ItemizedDeductionSource, "id">>): ItemizedDeductionSource {
  return {
    id: newId("itm"),
    kind: "otherItemized",
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newFederalTaxCreditSource(overrides?: Partial<Omit<FederalTaxCreditSource, "id">>): FederalTaxCreditSource {
  return {
    id: newId("crd"),
    kind: "childTaxCredit",
    label: "",
    amount: 0,
    ...overrides,
  };
}