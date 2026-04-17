import type {
  IncomeSource,
  ItemizedDeductionSource,
  FederalTaxCreditSource,
  PretaxBenefitSource,
} from "~/lib/taxCalc.types";
import type { FilingStatus } from "~/lib/taxData.types";
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
    kind: "income-ordinary-wages",
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newPretaxRow(overrides?: Partial<Omit<TaxFormPretaxRow, "type">>): TaxFormPretaxRow {
  return {
    type: "pretax",
    id: newId("ptx"),
    kind: "input-pretax-401K-preTax401kSpouse1",
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newDeductionRow(overrides?: Partial<Omit<TaxFormDeductionRow, "type">>): TaxFormDeductionRow {
  return {
    type: "deduction",
    id: newId("itm"),
    kind: "otherItemized",
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function newCreditRow(overrides?: Partial<Omit<TaxFormCreditRow, "type">>): TaxFormCreditRow {
  return {
    type: "credit",
    id: newId("crd"),
    kind: "childTaxCredit",
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

export function itemizedSourcesToRows(sources: ItemizedDeductionSource[]): TaxFormDeductionRow[] {
  return sources.map((s) => ({ type: "deduction" as const, ...s }));
}

export function federalCreditsToRows(sources: FederalTaxCreditSource[]): TaxFormCreditRow[] {
  return sources.map((s) => ({ type: "credit" as const, ...s }));
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
