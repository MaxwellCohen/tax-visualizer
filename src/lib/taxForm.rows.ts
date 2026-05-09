import type {
  TaxFormRow,
  TaxFormSettingId,
} from "~/lib/taxForm.types";

type LineItemRowType = "income" | "pretax" | "deduction" | "credit";

export function settingRowIndex(rows: TaxFormRow[], id: TaxFormSettingId): number {
  return rows.findIndex((r) => r.type === "setting" && r.id === id);
}

function rowIndicesByType(rows: TaxFormRow[], rowType: LineItemRowType): number[] {
  return rows.map((r, i) => (r.type === rowType ? i : -1)).filter((i): i is number => i >= 0);
}

export function incomeRowIndices(rows: TaxFormRow[]): number[] {
  return rowIndicesByType(rows, "income");
}

export function pretaxRowIndices(rows: TaxFormRow[]): number[] {
  return rowIndicesByType(rows, "pretax");
}

export function deductionRowIndices(rows: TaxFormRow[]): number[] {
  return rowIndicesByType(rows, "deduction");
}

export function creditRowIndices(rows: TaxFormRow[]): number[] {
  return rowIndicesByType(rows, "credit");
}

/** Resolve the current array index for a line-item row so form fields can bind by stable `id` instead of a stale numeric index after splices. */
export function indexOfTypedRowById(
  rows: TaxFormRow[],
  rowType: LineItemRowType,
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
  rowType: LineItemRowType,
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





