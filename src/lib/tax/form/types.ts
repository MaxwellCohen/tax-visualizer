import type { StateCode } from "~/lib/config/states/types";
import type { FilingStatus } from "~/lib/tax/data/types";

/** State of residence for state income tax; `"none"` leaves state tax out of the model. */
export type ResidenceState = StateCode | "none";

/** Single setting key in the form row list */
export type TaxFormSettingId =
  | "taxYear"
  | "filingStatus"
  | "residenceState"
  | "qualifyingChildren"
  | "otherDependents"
  | "useItemizedDeductions";

export type TaxFormSettingRow =
  | { type: "setting"; id: "taxYear"; value: number }
  | { type: "setting"; id: "filingStatus"; value: FilingStatus }
  | { type: "setting"; id: "residenceState"; value: ResidenceState }
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


