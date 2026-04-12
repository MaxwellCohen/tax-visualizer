import type { FilingStatus } from "~/lib/taxData.types";
import type {
  DeductionKind,
  FederalTaxCreditKind,
  IncomeKind,
  ItemizedDeductionKind,
  PretaxBenefitKind,
  TaxSegment,
} from "~/lib/taxCalc.types";

/** Single setting key in the form row list */
export type TaxFormSettingId = "taxYear" | "filingStatus" | "useItemizedDeductions";

export type TaxFormSettingRow =
  | { type: "setting"; id: "taxYear"; value: number }
  | { type: "setting"; id: "filingStatus"; value: FilingStatus }
  | { type: "setting"; id: "useItemizedDeductions"; value: boolean };

export type TaxFormIncomeRow = {
  type: "income";
  id: string;
  kind: IncomeKind;
  label: string;
  amount: number;
};

export type TaxFormPretaxRow = {
  type: "pretax";
  id: string;
  kind: PretaxBenefitKind;
  label: string;
  amount: number;
};

export type TaxFormDeductionRow = {
  type: "deduction";
  id: string;
  kind: ItemizedDeductionKind;
  label: string;
  amount: number;
};

export type TaxFormCreditRow = {
  type: "credit";
  id: string;
  kind: FederalTaxCreditKind;
  label: string;
  amount: number;
};

/** One row in the tax input form (settings + line items) */
export type TaxFormRow =
  | TaxFormSettingRow
  | TaxFormIncomeRow
  | TaxFormPretaxRow
  | TaxFormDeductionRow
  | TaxFormCreditRow;

export type TaxFormData = {
  rows: TaxFormRow[];
};

/** Pipeline output line: numeric metrics and structured metadata (e.g. bracket segments) */
export type TaxComputedRow = {
  type: "computed";
  id: string;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
};

export type TaxResultRow = TaxFormRow | TaxComputedRow;

/** Echo of input rows + appended computed rows; warnings/notes at top level */
export type TaxResult = {
  rows: TaxResultRow[];
  warnings: string[];
  notes: string[];
  errors: string[];
  metadata: Record<string, unknown>;
};

/** Resolved metrics for charts/summary (built from {@link TaxResult.rows} only) */
export type TaxChartMetrics = {
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
  ordinaryFederalSegments: TaxSegment[];
  longTermCapitalGainsSegments: TaxSegment[];
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

export function isComputedRow(row: TaxResultRow): row is TaxComputedRow {
  return row.type === "computed";
}

export function isFormRow(row: TaxResultRow): row is TaxFormRow {
  return row.type !== "computed";
}
