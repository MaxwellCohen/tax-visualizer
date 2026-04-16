import type {
  TaxFormIncomeRow,
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

/** Resolve the current array index for a line-item row so form fields can bind by stable `id` instead of a stale numeric index after splices. */
export function indexOfTypedRowById(
  rows: TaxFormRow[],
  rowType: "income" | "pretax" | "deduction" | "credit",
  id: string,
): number {
  return rows.findIndex((r) => r.type === rowType && r.id === id);
}

/**
 * Ids for Solid `<For each={...}>`: line rows are new object references on every form update, so `<For>` would
 * remap by identity and remount rows (focus loss). Primitive ids stay `===` across updates.
 */
export function rowIdsForTypedRows(
  rows: TaxFormRow[],
  rowType: "income" | "pretax" | "deduction" | "credit",
): string[] {
  return rows.filter((r) => r.type === rowType).map((r) => r.id);
}

/**
 * Stable setting id plus live index for Solid `<Show keyed>` around TanStack `Field` for `rows[i].value` settings.
 * Index shifts when income/pretax (etc.) rows are inserted before the setting row.
 */
export function settingRowFieldMountKey(rows: TaxFormRow[], id: TaxFormSettingId): string {
  const i = settingRowIndex(rows, id);
  return i >= 0 ? `setting:${id}@${i}` : "";
}

export function incomeRowsFromTaxResult(result: TaxResult): TaxFormIncomeRow[] {
  return result.rows.filter((r): r is TaxFormIncomeRow => r.type === "income");
}




