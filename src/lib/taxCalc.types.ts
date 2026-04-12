export type IncomeKind = "wages" | "ordinary" | "shortTermCapGains" | "longTermCapGains" | "selfEmployment";

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