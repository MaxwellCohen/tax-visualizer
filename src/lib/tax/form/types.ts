import type { FilingStatus } from "~/lib/tax/data/types";
import type {
  DeductionKind,
  TaxSegment,
} from "~/lib/tax/calc/types";

/** Single setting key in the form row list */
export type TaxFormSettingId =
  | "taxYear"
  | "filingStatus"
  | "qualifyingChildren"
  | "otherDependents"
  | "useItemizedDeductions";

export type TaxFormSettingRow =
  | { type: "setting"; id: "taxYear"; value: number }
  | { type: "setting"; id: "filingStatus"; value: FilingStatus }
  | { type: "setting"; id: "qualifyingChildren"; value: number }
  | { type: "setting"; id: "otherDependents"; value: number }
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


