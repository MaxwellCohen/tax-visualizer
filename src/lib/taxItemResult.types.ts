/**
 * Discriminated union of tax item calculator results (replaces untyped metadata bags).
 */
import type { DeductionKind, IncomeSource, LtcgTaxSegment, TaxSegment } from "~/lib/taxCalc.types";

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
  sources: IncomeSource[];
  totalIncome: number;
};

/** Effective pretax amounts after caps; keys mirror former metadata field names. */
export type PretaxBenefitsResult = {
  id: "pretax-benefits";
  label: string;
  amount: number;
  category: "pretax";
  "401k": number;
  "401kSpouse1": number;
  "401kSpouse2": number;
  hsa: number;
  hsaSpouse1: number;
  hsaSpouse2: number;
  ira: number;
  iraSpouse1: number;
  iraSpouse2: number;
  other: number;
  totalPretax: number;
  traditionalIra: number;
  wagesAfterPretax: number;
  effective401k: number;
  effectiveHsa: number;
};

export type DeductionCalculationResult = {
  id: "deduction-calculation";
  label: string;
  amount: number;
  category: "deduction";
  kind: DeductionKind;
  standardDeduction: number;
  itemizedDeductions: number;
  salt: number;
  medicalDental: number;
  mortgageInterest: number;
  charitable: number;
};

export type FederalOrdinaryTaxResult = {
  id: "federal-ordinary-tax";
  label: string;
  amount: number;
  category: "tax";
  ordinaryTaxableIncome: number;
  marginalRate: number;
  segments: TaxSegment[];
};

export type FederalLtcgTaxResult = {
  id: "federal-ltcg-tax";
  label: string;
  amount: number;
  category: "tax";
  longTermTaxableIncome: number;
  longTermCapGains: number;
  segments: LtcgTaxSegment[];
};

export type FederalNiitResult = {
  id: "federal-niit";
  label: string;
  amount: number;
  category: "tax";
  netInvestmentIncome: number;
  magi: number;
  magiOverThreshold: number;
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
  medicareTax: number;
  additionalMedicare: number;
  wagesForPayroll: number;
};

export type TakeHomeResult = {
  id: "take-home-calculation";
  label: string;
  amount: number;
  category: "income";
  effectiveRate: number;
  /** Top ordinary federal bracket rate (for display). */
  marginalFederalRate: number;
  totalIncome: number;
  preTaxTotal: number;
  federalTax: number;
  payrollTax: number;
  pretaxIra: number;
  wagesAfterPretax: number;
  selfEmploymentTax: number;
  totalTax: number;
};

export type SelfEmploymentTaxResult = {
  id: "self-employment-tax";
  label: string;
  amount: number;
  category: "tax";
  seSocialSecurityTax: number;
  seMedicareTax: number;
  additionalMedicareTax: number;
  netEarnings: number;
  selfEmploymentIncome: number;
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
