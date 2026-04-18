import type { FilingStatus } from "~/lib/taxData.types";
import type {
  DeductionKind,
  TaxSegment,
} from "~/lib/taxCalc.types";
import type { MekkoRow } from "~/lib/taxCharts.buildMekko";

/** Single setting key in the form row list */
export type TaxFormSettingId = "taxYear" | "filingStatus" | "useItemizedDeductions";

export type TaxFormSettingRow =
  | { type: "setting"; id: "taxYear"; value: number }
  | { type: "setting"; id: "filingStatus"; value: FilingStatus }
  | { type: "setting"; id: "useItemizedDeductions"; value: boolean };

export type TaxFormIncomeRow = {
  type: "income";
  id: string;
  kind: string;
  label: string;
  amount: number;
};

export type TaxFormPretaxRow = {
  type: "pretax";
  id: string;
  kind: string;
  label: string;
  amount: number;
};

export type TaxFormDeductionRow = {
  type: "deduction";
  id: string;
  kind: string;
  label: string;
  amount: number;
};

export type TaxFormCreditRow = {
  type: "credit";
  id: string;
  kind: string;
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

/** Pre-built Mekko rows; produced with {@link TaxResult.metricLines} in the pipeline. */
export type TaxResultDisplay = {
  mekko: TaxResultMekkoDisplay;
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
  metricsKey: string;
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
export type TaxMetricValueKind = "number" | "deductionKind";

export type TaxMetricComputedValue = number | TaxSegment[] | DeductionKind;

/** One evaluated chart metric line (canonical pipeline output). */
export type TaxMetricLine = {
  id: string;
  metricsKey: string;
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


export function isFormRow(row: TaxResultRow): row is TaxFormRow {
  return row.type !== "computed" && row.type !== "computed-segments";
}
