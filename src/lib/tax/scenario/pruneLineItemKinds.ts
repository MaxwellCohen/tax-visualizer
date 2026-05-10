import { getAllowedLineItemKindSets } from "~/lib/config/taxPage/allowedInputKinds";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/tax/calc/inputs";
import type { TaxFormRow } from "~/lib/tax/form/types";
import { incomeRowIndices, settingRowIndex } from "~/lib/tax/form/rows";
import {
  newCreditRow,
  newDeductionRow,
  newIncomeRow,
  newPretaxRow,
} from "~/lib/tax/form/factories";

type LineItemRowType = Exclude<TaxFormRow["type"], "setting">;
type LineItemRow = Extract<TaxFormRow, { type: LineItemRowType }>;
type AllowedLineItemKindSets = ReturnType<typeof getAllowedLineItemKindSets>;

const LINE_ITEM_ROW_TYPES = ["income", "pretax", "deduction", "credit"] as const satisfies readonly LineItemRowType[];

const defaultLineItemRows = {
  income: newIncomeRow,
  pretax: newPretaxRow,
  deduction: newDeductionRow,
  credit: newCreditRow,
} satisfies Record<LineItemRowType, () => LineItemRow>;

function insertionIndexForMissingRow(rows: TaxFormRow[], rowType: LineItemRowType): number {
  if (rowType === "income") {
    const filingStatusIndex = settingRowIndex(rows, "filingStatus");
    return filingStatusIndex >= 0 ? filingStatusIndex + 1 : 0;
  }

  if (rowType === "pretax") {
    const incomeIndices = incomeRowIndices(rows);
    const filingStatusIndex = settingRowIndex(rows, "filingStatus");
    return incomeIndices.length > 0 ? incomeIndices[incomeIndices.length - 1]! + 1 : filingStatusIndex + 1;
  }

  if (rowType === "deduction") {
    const useItemizedDeductionsIndex = settingRowIndex(rows, "useItemizedDeductions");
    return useItemizedDeductionsIndex >= 0 ? useItemizedDeductionsIndex + 1 : rows.length;
  }

  return rows.length;
}

function ensureLineItemMinimum(rows: TaxFormRow[], rowType: LineItemRowType): void {
  if (rows.some((row) => row.type === rowType)) return;

  rows.splice(insertionIndexForMissingRow(rows, rowType), 0, defaultLineItemRows[rowType]());
}

function ensureLineItemMinimums(rows: TaxFormRow[]): TaxFormRow[] {
  const result = [...rows];

  for (const rowType of LINE_ITEM_ROW_TYPES) {
    ensureLineItemMinimum(result, rowType);
  }

  return result;
}

function isLineItemRow(row: TaxFormRow): row is LineItemRow {
  return row.type !== "setting";
}

function isAllowedLineItemRow(row: LineItemRow, allowed: AllowedLineItemKindSets): boolean {
  return allowed[row.type].has(row.kind);
}

/**
 * Drops line-item rows whose `kind` is not allowed for the current tax year and filing status.
 * Ensures at least one income, pretax, deduction, and credit row.
 */
export function pruneDisallowedLineItemKinds(rows: TaxFormRow[]): TaxFormRow[] {
  const taxYear = getTaxYearFromRows(rows);
  const filingStatus = getFilingStatusFromRows(rows);
  const config = getTaxYearConfig(taxYear);
  if (!config) {
    return rows;
  }

  const allowed = getAllowedLineItemKindSets(config, filingStatus);
  const out = rows.filter((row) => !isLineItemRow(row) || isAllowedLineItemRow(row, allowed));

  return ensureLineItemMinimums(out);
}
