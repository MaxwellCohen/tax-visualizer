
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
  kind: string;
  label: string;
  amount: number;
};

export type PretaxBenefitKind = 
  | "input-pretax-401K-preTax401kSpouse1"
  | "input-pretax-401K-preTax403bSpouse1"
  | "input-pretax-401K-preTax457bSpouse1"
  | "input-pretax-401K-preTax401kSpouse2"
  | "input-pretax-401K-preTax403bSpouse2"
  | "input-pretax-401K-preTax457bSpouse2"
  | "input-pretax-hsa-preTaxHsaSpouse1"
  | "input-pretax-hsa-preTaxHsaSpouse2"
  | "input-pretax-otherPretax-preTaxOther"
  | "input-pretax-otherPretax-preTaxHealthFsaSpouse1"
  | "input-pretax-otherPretax-preTaxHealthFsaSpouse2"
  | "input-pretax-otherPretax-preTaxDependentCareFsaSpouse1"
  | "input-pretax-otherPretax-preTaxDependentCareFsaSpouse2"
  | "input-pretax-otherPretax-preTaxCommuterSpouse1"
  | "input-pretax-otherPretax-preTaxCommuterSpouse2"
  | "input-pretax-traditionalIra-traditionalIraSpouse1"
  | "input-pretax-traditionalIra-traditionalIraSpouse2";

export type PretaxBenefitSource = {
  id: string;
  kind: string;
  label: string;
  amount: number;
};


export type ItemizedDeductionSource = {
  id: string;
  kind: string;
  label: string;
  amount: number;
};

export type FederalTaxCreditSource = {
  id: string;
  kind: string;
  label: string;
  amount: number;
};

export type DeductionKind = "standard" | "itemized";