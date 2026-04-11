import type { FilingStatus } from "~/lib/taxData.types";

export type IncomeKind = "wages" | "ordinary" | "shortTermCapGains" | "longTermCapGains";

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
  /** Traditional 401(k)/403(b) deferrals; per spouse when filing jointly (each has its own IRS deferral cap). */
  preTax401kSpouse1: number;
  preTax401kSpouse2: number;
  /** Payroll HSA; split by spouse when filing jointly (family HDHP uses a combined contribution cap). */
  preTaxHsaSpouse1: number;
  preTaxHsaSpouse2: number;
  /** Other cafeteria amounts (FSA, transit, etc.); treated like HSA for FICA. */
  preTaxOther: number;
  /**
   * Deductible traditional IRA (non-payroll); reduces federal ordinary income only, not FICA.
   * Per spouse when filing jointly; each capped by `traditionalIraContribution` for the year.
   */
  traditionalIraSpouse1: number;
  traditionalIraSpouse2: number;
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
