import type {
  TaxFormCreditRow,
  TaxFormDeductionRow,
  TaxFormIncomeRow,
  TaxFormPretaxRow,
  TaxFormRow,
  TaxFormSettingId,
  TaxResult,
} from "~/lib/taxForm.types";

export function settingRowIndex(rows: TaxFormRow[], id: TaxFormSettingId): number {
  return rows.findIndex((r) => r.type === "setting" && r.id === id);
}

export function incomeRowIndices(rows: TaxFormRow[]): number[] {
  return rows.map((r, i) => (r.type === "income" ? i : -1)).filter((i): i is number => i >= 0);
}

export function pretaxRowIndices(rows: TaxFormRow[]): number[] {
  return rows.map((r, i) => (r.type === "pretax" ? i : -1)).filter((i): i is number => i >= 0);
}

export function deductionRowIndices(rows: TaxFormRow[]): number[] {
  return rows.map((r, i) => (r.type === "deduction" ? i : -1)).filter((i): i is number => i >= 0);
}

export function creditRowIndices(rows: TaxFormRow[]): number[] {
  return rows.map((r, i) => (r.type === "credit" ? i : -1)).filter((i): i is number => i >= 0);
}

export function incomeRowsFromTaxResult(result: TaxResult): TaxFormIncomeRow[] {
  return result.rows.filter((r): r is TaxFormIncomeRow => r.type === "income");
}

function pretaxRowsFromTaxResult(result: TaxResult): TaxFormPretaxRow[] {
  return result.rows.filter((r): r is TaxFormPretaxRow => r.type === "pretax");
}

function deductionRowsFromTaxResult(result: TaxResult): TaxFormDeductionRow[] {
  return result.rows.filter((r): r is TaxFormDeductionRow => r.type === "deduction");
}

function creditRowsFromTaxResult(result: TaxResult): TaxFormCreditRow[] {
  return result.rows.filter((r): r is TaxFormCreditRow => r.type === "credit");
}
