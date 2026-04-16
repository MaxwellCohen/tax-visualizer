export type IncomeKind = "input-wages-wages" | "input-selfEmployment-selfEmployment" | "input-shortTermCapGains-shortTermCapGains" | "input-longTermCapGains-longTermCapGains" | "input-ordinary-ordinary";

export type TaxSegment = {
  id?: string;
  rangeStart: number;
  rangeEnd: number | null;
  incomeAmount: number;
  taxAmount: number;
  marginalRate: number;
};

/** Long-term capital gains bracket slice (stacking worksheet). */
export type LtcgTaxSegment = {
  rate: number;
  upTo: number | null;
  rangeStart: number;
  rangeEnd: number | null;
  incomeAmount: number;
  taxAmount: number;
};

export type IncomeSource = {
  id: string;
  kind: IncomeKind;
  label: string;
  amount: number;
};

export type PretaxBenefitKind = 
  | "input-401k-preTax401kSpouse1"
  | "input-401k-preTax403bSpouse1"
  | "input-401k-preTax457bSpouse1"
  | "input-401k-preTax401kSpouse2"
  | "input-401k-preTax403bSpouse2"
  | "input-401k-preTax457bSpouse2"
  | "hsa-preTaxHsaSpouse1"
  | "hsa-preTaxHsaSpouse2"
  | "otherPretax-preTaxOther"
  | "otherPretax-preTaxHealthFsaSpouse1"
  | "otherPretax-preTaxHealthFsaSpouse2"
  | "otherPretax-preTaxDependentCareFsaSpouse1"
  | "otherPretax-preTaxDependentCareFsaSpouse2"
  | "otherPretax-preTaxCommuterSpouse1"
  | "otherPretax-preTaxCommuterSpouse2"
  | "input-traditionalIra-traditionalIraSpouse1"
  | "input-traditionalIra-traditionalIraSpouse2";

export type PretaxBenefitSource = {
  id: string;
  kind: PretaxBenefitKind;
  label: string;
  amount: number;
};

export type ItemizedDeductionKind = 
  | "salt-salt"
  | "medicalDental-medicalDental"
  | "mortgageInterest-mortgageInterest"
  | "charitable-charitable"
  | "investmentInterest"
  | "casualtyTheft"
  | "otherItemized";

export type ItemizedDeductionSource = {
  id: string;
  kind: ItemizedDeductionKind;
  label: string;
  amount: number;
};

export type FederalTaxCreditKind = 
  | "childTaxCredit-childTaxCredit"
  | "childTaxCredit-creditForOtherDependents"
  | "educationCredits-educationCredits"
  | "retirementSavingsContributions-retirementSavingsContributions"
  | "otherFederalCredit-otherFederalCredit"
  | "otherFederalCredit-childAndDependentCare"
  | "otherFederalCredit-foreignTaxCredit"
  | "otherFederalCredit-residentialCleanEnergy"
  | "otherFederalCredit-electricVehicleCredit"
  | "otherFederalCredit-generalBusinessCredit";

export type FederalTaxCreditSource = {
  id: string;
  kind: FederalTaxCreditKind;
  label: string;
  amount: number;
};

export type DeductionKind = "standard" | "itemized";