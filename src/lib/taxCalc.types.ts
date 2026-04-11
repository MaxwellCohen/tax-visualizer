import type { FilingStatus } from "~/lib/taxData.types";
import type { PretaxBenefitSource } from "~/lib/taxCalc.pretaxBenefitSource";

export type IncomeKind = "wages" | "ordinary" | "shortTermCapGains" | "longTermCapGains";

export type { PretaxBenefitKind, PretaxBenefitSource } from "~/lib/taxCalc.pretaxBenefitSource";

export type IncomeSource = {
  id: string;
  kind: IncomeKind;
  /** Shown in charts; if empty, a default by kind is used. */
  label: string;
  amount: number;
};

export type TaxInput = {
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  /**
   * Pre-tax payroll + deductible traditional IRA lines. Multiple rows may share a kind; amounts aggregate
   * before caps and wage scaling in `taxCalc`.
   */
  pretaxBenefitSources: PretaxBenefitSource[];
  useItemizedDeductions: boolean;
  itemizedDeductions: number;
};

export type DeductionKind = "standard" | "itemized";
type TaxSegmentKind = "ordinaryFederal" | "longTermCapGains";

export type TaxSegment = {
  id: string;
  kind: TaxSegmentKind;
  incomeAmount: number;
  taxAmount: number;
  marginalRate: number;
  rangeStart: number;
  rangeEnd: number | null;
};

export type TaxResult = {
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  totalIncome: number;
  wageIncome: number;
  ordinaryGrossIncome: number;
  /** Gross short-term capital gains (before deductions); taxed as ordinary income (IRS Topic 409). */
  shortTermCapGainsGrossIncome: number;
  longTermCapitalGainsGrossIncome: number;
  /** Effective amounts after capping to total W-2 wages (pro-rated if over). */
  preTax401k: number;
  preTaxHsa: number;
  preTaxOther: number;
  /** Payroll pre-tax only (401(k), HSA, other); traditional IRA is separate. */
  preTaxTotal: number;
  /** Effective deductible traditional IRA after IRS per-person and compensation caps in this model. */
  traditionalIra: number;
  wagesAfterPretax: number;
  deductionKind: DeductionKind;
  standardDeduction: number;
  deductionAmount: number;
  /** Ordinary + short-term + wages slice after deductions (federal ordinary brackets). */
  ordinaryTaxableIncome: number;
  /** Long-term capital gain amount after deductions (preferential LTCG rates). */
  longTermTaxableIncome: number;
  taxableIncome: number;
  /** Federal tax on ordinary taxable income (progressive brackets). */
  federalOrdinaryIncomeTax: number;
  /** Federal tax on long-term gains (0% / 15% / 20% stacked on ordinary taxable income). */
  federalLongTermCapGainsTax: number;
  /** §1411 net investment income tax (simplified: investment income ×3.8% capped by MAGI over threshold). */
  federalNetInvestmentIncomeTax: number;
  /** Sum of taxable STCG + taxable LTCG used as net investment income for the NIIT estimate. */
  netInvestmentIncome: number;
  federalIncomeTax: number;
  payrollTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  takeHomePay: number;
  effectiveTaxRate: number;
  ordinaryFederalSegments: TaxSegment[];
  longTermCapitalGainsSegments: TaxSegment[];
  warnings: string[];
  notes: string[];
};
