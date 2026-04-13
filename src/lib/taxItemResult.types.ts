/**
 * Discriminated union of tax item calculator results (replaces untyped metadata bags).
 */
import type { DeductionKind, LtcgTaxSegment, TaxSegment } from "~/lib/taxCalc.types";

export type IncomeAggregationResult = {
  id: "income-aggregation";
  label: string;
  amount: number;
  category: "income";
  wageIncome: number;
  selfEmploymentIncome: number;
  ordinaryIncome: number;
  shortTermCapGains: number;
  longTermCapGains: number;
  totalIncome: number;
};

/** Effective pretax amounts after caps (401k/HSA/other excl. IRA; IRA separate). */
export type PretaxBenefitsResult = {
  id: "pretax-benefits";
  label: string;
  /** Payroll pre-tax total excluding traditional IRA (same meaning as chart `preTaxTotal`). */
  amount: number;
  category: "pretax";
  "401k": number;
  hsa: number;
  other: number;
  traditionalIra: number;
  wagesAfterPretax: number;
};

export type DeductionCalculationResult = {
  id: "deduction-calculation";
  label: string;
  amount: number;
  category: "deduction";
  kind: DeductionKind;
  standardDeduction: number;
};

export type FederalOrdinaryTaxResult = {
  id: "federal-ordinary-tax";
  label: string;
  amount: number;
  category: "tax";
  ordinaryTaxableIncome: number;
  segments: TaxSegment[];
};

export type FederalLtcgTaxResult = {
  id: "federal-ltcg-tax";
  label: string;
  amount: number;
  category: "tax";
  longTermTaxableIncome: number;
  segments: LtcgTaxSegment[];
};

export type FederalNiitResult = {
  id: "federal-niit";
  label: string;
  amount: number;
  category: "tax";
  netInvestmentIncome: number;
};

export type TaxCreditsResult = {
  id: "tax-credits";
  label: string;
  amount: number;
  category: "credit";
  creditsEntered: number;
  creditsApplied: number;
  /** Federal income tax before credits (ordinary + LTCG + NIIT). */
  totalTaxLiability: number;
  /** Federal income tax after nonrefundable credits are applied. */
  federalIncomeTaxAfterCredits: number;
  childTaxCredit: number;
  educationCredits: number;
  retirementSavings: number;
  other: number;
};

export type PayrollTaxResult = {
  id: "payroll-tax";
  label: string;
  amount: number;
  category: "tax";
  socialSecurityTax: number;
  /** Includes base Medicare + additional Medicare when applicable. */
  medicareTax: number;
};

export type TakeHomeResult = {
  id: "take-home-calculation";
  label: string;
  amount: number;
  category: "income";
  effectiveRate: number;
  /** Top ordinary federal bracket rate (for display). */
  marginalFederalRate: number;
};

export type SelfEmploymentTaxResult = {
  id: "self-employment-tax";
  label: string;
  amount: number;
  category: "tax";
};

export type TaxItemResult =
  | IncomeAggregationResult
  | PretaxBenefitsResult
  | DeductionCalculationResult
  | FederalOrdinaryTaxResult
  | FederalLtcgTaxResult
  | FederalNiitResult
  | TaxCreditsResult
  | PayrollTaxResult
  | TakeHomeResult
  | SelfEmploymentTaxResult;
