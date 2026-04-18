import { getAllowedLineItemKindSets } from "~/lib/config/page/allowedInputKinds";
import {
  DEFAULT_FEDERAL_CREDIT_KIND,
  DEFAULT_INCOME_KIND,
  DEFAULT_ITEMIZED_DEDUCTION_KIND,
  DEFAULT_PRETAX_BENEFIT_KIND,
} from "~/lib/config/page/inputKindKeys";
import { getTaxYearConfig } from "~/lib/taxData";
import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import type { TaxFormRow } from "~/lib/taxForm.types";
import { incomeRowIndices, settingRowIndex } from "~/lib/taxForm.rows";
import {
  newCreditRow,
  newDeductionRow,
  newIncomeRow,
  newPretaxRow,
} from "~/lib/taxForm.factories";

function ensureLineItemMinimums(rows: TaxFormRow[]): TaxFormRow[] {
  const result = [...rows];

  if (!result.some((r) => r.type === "income")) {
    const i = settingRowIndex(result, "filingStatus");
    const at = i >= 0 ? i + 1 : 0;
    result.splice(at, 0, newIncomeRow({ kind: DEFAULT_INCOME_KIND }));
  }
  if (!result.some((r) => r.type === "pretax")) {
    const inc = incomeRowIndices(result);
    const at =
      inc.length > 0 ? inc[inc.length - 1]! + 1 : settingRowIndex(result, "filingStatus") + 1;
    result.splice(at, 0, newPretaxRow({ kind: DEFAULT_PRETAX_BENEFIT_KIND }));
  }
  if (!result.some((r) => r.type === "deduction")) {
    const ui = settingRowIndex(result, "useItemizedDeductions");
    const at = ui >= 0 ? ui + 1 : result.length;
    result.splice(at, 0, newDeductionRow({ kind: DEFAULT_ITEMIZED_DEDUCTION_KIND }));
  }
  if (!result.some((r) => r.type === "credit")) {
    result.push(newCreditRow({ kind: DEFAULT_FEDERAL_CREDIT_KIND }));
  }

  return result;
}

/**
 * Drops line-item rows whose `kind` is not allowed for the current tax year and filing status.
 * Ensures at least one income, pretax, deduction, and credit row (defaults from `inputKindKeys`).
 */
export function pruneDisallowedLineItemKinds(rows: TaxFormRow[]): TaxFormRow[] {
  const taxYear = getTaxYearFromRows(rows);
  const filingStatus = getFilingStatusFromRows(rows);
  const config = getTaxYearConfig(taxYear);
  if (!config) {
    return rows;
  }

  const allowed = getAllowedLineItemKindSets(config, filingStatus);
  const out: TaxFormRow[] = [];

  for (const row of rows) {
    if (row.type === "setting") {
      out.push(row);
      continue;
    }
    if (row.type === "income") {
      if (allowed.income.has(row.kind)) out.push(row);
      continue;
    }
    if (row.type === "pretax") {
      if (allowed.pretax.has(row.kind)) out.push(row);
      continue;
    }
    if (row.type === "deduction") {
      if (allowed.deduction.has(row.kind)) out.push(row);
      continue;
    }
    if (row.type === "credit") {
      if (allowed.credit.has(row.kind)) out.push(row);
      continue;
    }
  }

  return ensureLineItemMinimums(out);
}
