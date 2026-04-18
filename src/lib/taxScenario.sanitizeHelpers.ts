import type { FilingStatus } from "~/lib/taxData";
import type { TaxFormData } from "~/lib/taxForm.types";
import {
  newCreditRow,
  newDeductionRow,
  newIncomeRow,
  newPretaxRow,
  taxFormDataFromParts,
} from "~/lib/taxForm.factories";

const DEFAULT_FILING_STATUS: FilingStatus = "single";

const filingStatuses = new Set<FilingStatus>([
  "single",
  "marriedJoint",
  "marriedSeparate",
  "headOfHousehold",
]);

export function sanitizeMoney(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric;
}

export function sanitizeFilingStatus(value: unknown): FilingStatus {
  return filingStatuses.has(value as FilingStatus)
    ? (value as FilingStatus)
    : DEFAULT_FILING_STATUS;
}

export function fallbackScenario(fallbackYear: number): TaxFormData {
  return taxFormDataFromParts({
    taxYear: fallbackYear,
    filingStatus: DEFAULT_FILING_STATUS,
    incomeRows: [newIncomeRow({ amount: 90_000 })],
    pretaxRows: [newPretaxRow()],
    useItemizedDeductions: false,
    deductionRows: [newDeductionRow()],
    creditRows: [newCreditRow()],
  });
}

export function normalizeTaxYear(rawTaxYear: unknown, availableYears: number[], fallbackYear: number): number {
  const taxYear = Number(rawTaxYear);
  return availableYears.includes(taxYear) ? taxYear : fallbackYear;
}
