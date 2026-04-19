import type {
  IncomeSource,
  PretaxBenefitSource,
} from "~/lib/taxCalc.types";
import type { FilingStatus } from "~/lib/taxData.types";
import {
  DEFAULT_FEDERAL_CREDIT_KIND,
  DEFAULT_INCOME_KIND,
  DEFAULT_ITEMIZED_DEDUCTION_KIND,
  DEFAULT_PRETAX_BENEFIT_KIND,
} from "~/lib/config/page/inputKindKeys";
import type {
  TaxFormCreditRow,
  TaxFormData,
  TaxFormDeductionRow,
  TaxFormIncomeRow,
  TaxFormPretaxRow,
} from "~/lib/taxForm.types";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export function newIncomeRow(overrides?: Partial<Omit<TaxFormIncomeRow, "type">>): TaxFormIncomeRow {
  return {
    type: "income",
    id: newId("inc"),
    kind: DEFAULT_INCOME_KIND,
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newPretaxRow(overrides?: Partial<Omit<TaxFormPretaxRow, "type">>): TaxFormPretaxRow {
  return {
    type: "pretax",
    id: newId("ptx"),
    kind: DEFAULT_PRETAX_BENEFIT_KIND,
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newDeductionRow(overrides?: Partial<Omit<TaxFormDeductionRow, "type">>): TaxFormDeductionRow {
  return {
    type: "deduction",
    id: newId("itm"),
    kind: DEFAULT_ITEMIZED_DEDUCTION_KIND,
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newCreditRow(overrides?: Partial<Omit<TaxFormCreditRow, "type">>): TaxFormCreditRow {
  return {
    type: "credit",
    id: newId("crd"),
    kind: DEFAULT_FEDERAL_CREDIT_KIND,
    label: "",
    amount: 0,
    ...overrides,
  };
}

/** Pretax benefit list as form rows */
export function pretaxSourcesToRows(sources: PretaxBenefitSource[]): TaxFormPretaxRow[] {
  return sources.map((s) => ({ type: "pretax" as const, ...s }));
}

export function incomeSourcesToRows(sources: IncomeSource[]): TaxFormIncomeRow[] {
  return sources.map((s) => ({ type: "income" as const, ...s }));
}



/** Canonical row order: settings (year, filing), incomes, pretax, itemized toggle, deductions, credits */
export function taxFormDataFromParts(args: {
  taxYear: number;
  filingStatus: FilingStatus;
  incomeRows: TaxFormIncomeRow[];
  pretaxRows: TaxFormPretaxRow[];
  useItemizedDeductions: boolean;
  deductionRows: TaxFormDeductionRow[];
  creditRows: TaxFormCreditRow[];
}): TaxFormData {
  return {
    rows: [
      { type: "setting", id: "taxYear", value: args.taxYear },
      { type: "setting", id: "filingStatus", value: args.filingStatus },
      ...args.incomeRows,
      ...args.pretaxRows,
      { type: "setting", id: "useItemizedDeductions", value: args.useItemizedDeductions },
      ...args.deductionRows,
      ...args.creditRows,
    ],
  };
}
