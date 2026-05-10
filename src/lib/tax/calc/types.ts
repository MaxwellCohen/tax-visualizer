
/** Long-term capital gains bracket slice (stacking worksheet). */
export type IncomeSource = {
  id: string;
  kind: string;
  label: string;
  amount: number;
};


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
