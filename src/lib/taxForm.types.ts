import type { FilingStatus } from "~/lib/taxData.types";
import type {
  DeductionKind,
  FederalTaxCreditKind,
  IncomeKind,
  ItemizedDeductionKind,
  PretaxBenefitKind,
  TaxSegment,
} from "~/lib/taxCalc.types";
import type { MekkoRow, SankeyChartData } from "~/lib/taxCharts.types";

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

/** Numeric pipeline output line */
export type TaxComputedNumericRow = {
  type: "computed";
  id: string;
  value: number;
  label?: string;
};

/** Bracket segment arrays serialized on {@link TaxResult.rows} (not folded into {@link TaxComputedNumericRow}). */
export type TaxComputedSegmentRow = {
  type: "computed-segments";
  id: string;
  segments: TaxSegment[];
};

export type TaxComputedRow = TaxComputedNumericRow;

export type TaxResultRow = TaxFormRow | TaxComputedRow | TaxComputedSegmentRow;

/** Pre-built Mekko band rows (aligned with Sankey federal credit split). */
export type TaxResultMekkoDisplay = {
  rows: MekkoRow[];
};

/** Pre-built Sankey graph + Mekko rows; produced with {@link TaxResult.metricLines} in the pipeline. */
export type TaxResultDisplay = {
  sankey: SankeyChartData;
  mekko: TaxResultMekkoDisplay;
};

/** Resolved metrics for charts/summary (record view of metric lines). */
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
  /** Top ordinary federal bracket rate (from pipeline take-home). */
  marginalFederalRate: number;
  /** Per-credit amounts entered (from pipeline tax credits). */
  childTaxCredit: number;
  educationCredits: number;
  retirementSavings: number;
  federalCreditOther: number;
};

/** Detailed tax breakdown list (driven by chart metrics registry `detailedDisplay` metadata). */
export type DisplayCategory = "income" | "pretax" | "deduction" | "tax" | "credit" | "summary";

export type DisplayItemFormat = "currency" | "percent" | "number";

export type DisplayItemConfig = {
  type: string;
  label: string;
  category: DisplayCategory;
  color?: string;
  format: DisplayItemFormat;
  order: number;
  tooltip?: string;
  highlight?: boolean;
  /** Resolved via {@link TaxChartMetrics} from the chart metrics registry. */
  metricsKey: keyof TaxChartMetrics;
  defaultAmount?: number;
};

export type DisplayItem = {
  type: string;
  amount: number;
  label: string;
  category: DisplayCategory;
  color?: string;
  format: DisplayItemFormat;
  order: number;
  tooltip?: string;
  highlight?: boolean;
};

/** How a single registry metric stores its computed value on a line. */
export type TaxMetricValueKind = "number" | "segments" | "deductionKind";

export type TaxMetricComputedValue = number | TaxSegment[] | DeductionKind;

/** One evaluated chart metric line (canonical pipeline output). */
export type TaxMetricLine = {
  id: string;
  metricsKey: keyof TaxChartMetrics;
  valueKind: TaxMetricValueKind;
  value: TaxMetricComputedValue;
};

/**
 * Echo of input rows + appended computed rows. Successful runs include {@link TaxMetricLine} and
 * {@link TaxResultDisplay} so charts do not recompute tax or duplicate allocation helpers.
 */
export type TaxResult = {
  rows: TaxResultRow[];
  /** Present when the tax pipeline completed; ordered per the chart metrics registry. */
  metricLines?: TaxMetricLine[];
  /** Present with `metricLines` when charts were built in the pipeline. */
  display?: TaxResultDisplay;
  notes: string[];
  errors: string[];
};

export function isComputedRow(row: TaxResultRow): row is TaxComputedRow {
  return row.type === "computed";
}

export function isComputedSegmentRow(row: TaxResultRow): row is TaxComputedSegmentRow {
  return row.type === "computed-segments";
}

export function isFormRow(row: TaxResultRow): row is TaxFormRow {
  return row.type !== "computed" && row.type !== "computed-segments";
}
