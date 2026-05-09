import type { TaxCalculationInputs } from "~/lib/taxConfig.types";
import type { FilingStatus } from "~/lib/taxData.types";
import type {
  TaxFormCreditRow,
  TaxFormDeductionRow,
  TaxFormIncomeRow,
  TaxFormPretaxRow,
  TaxFormRow,
} from "~/lib/taxForm.types";

export function getTaxYearFromRows(rows: TaxFormRow[]): number {
  return rows.find(row => row.type === "setting" && row.id === "taxYear")?.value ?? new Date().getFullYear();
}

export function getFilingStatusFromRows(rows: TaxFormRow[]): FilingStatus {
  for (const row of rows) {
    if (row.type === "setting" && row.id === "filingStatus") {
      return row.value;
    }
  }
  return "single";
}

function getUseItemizedFromRows(rows: TaxFormRow[]): boolean {
  for (const row of rows) {
    if (row.type === "setting" && row.id === "useItemizedDeductions") {
      return row.value;
    }
  }
  return false;
}

function getNumericSettingFromRows(rows: TaxFormRow[], id: "qualifyingChildren" | "otherDependents"): number {
  for (const row of rows) {
    if (row.type === "setting" && row.id === id) {
      return Number.isFinite(row.value) ? row.value : 0;
    }
  }
  return 0;
}

export function rowsToTaxCalculationInputs(rows: TaxFormRow[]): TaxCalculationInputs {
  const taxYear = getTaxYearFromRows(rows);
  const filingStatus = getFilingStatusFromRows(rows);
  const useItemizedDeductions = getUseItemizedFromRows(rows);
  const qualifyingChildren = getNumericSettingFromRows(rows, "qualifyingChildren");
  const otherDependents = getNumericSettingFromRows(rows, "otherDependents");

  const incomeSources = rows
    .filter((r): r is TaxFormIncomeRow => r.type === "income")
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label,
      amount: r.amount,
    }));

  const pretaxBenefitSources = rows
    .filter((r): r is TaxFormPretaxRow => r.type === "pretax")
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label,
      amount: r.amount,
    }));

  const itemizedDeductions = rows
    .filter((r): r is TaxFormDeductionRow => r.type === "deduction")
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label,
      amount: r.amount,
    }));

  const federalTaxCredits = rows
    .filter((r): r is TaxFormCreditRow => r.type === "credit")
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label,
      amount: r.amount,
    }));

  return {
    taxYear,
    filingStatus,
    qualifyingChildren,
    otherDependents,
    incomeSources,
    pretaxBenefitSources,
    useItemizedDeductions,
    itemizedDeductions,
    federalTaxCredits,
  };
}
