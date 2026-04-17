import type { FilingStatus } from "~/lib/taxData";
import {
  emptyAggregatedPretax,
  pretaxScalarsToMinimalSources,
} from "~/lib/taxCalc.pretaxBenefitSource";
import type { TaxFormData } from "~/lib/taxForm.types";
import {
  newCreditRow,
  newDeductionRow,
  newIncomeRow,
  pretaxSourcesToRows,
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

export function sanitizeIncomeKind(value: unknown): string {
 return `${value}`
}

export function sanitizePretaxBenefitKind(value: unknown): string {
  return value as string
}

export function sanitizeItemizedDeductionKind(value: unknown): string {
  return value as string
}

export function sanitizeFederalTaxCreditKind(value: unknown): string {
  return value as string
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
    incomeRows: [newIncomeRow({ kind: "income-ordinary-wages", amount: 90_000 })],
    pretaxRows: pretaxSourcesToRows(pretaxScalarsToMinimalSources(emptyAggregatedPretax())),
    useItemizedDeductions: false,
    deductionRows: [newDeductionRow({ kind: "otherItemized" })],
    creditRows: [newCreditRow()],
  });
}

export function normalizeTaxYear(rawTaxYear: unknown, availableYears: number[], fallbackYear: number): number {
  const taxYear = Number(rawTaxYear);
  return availableYears.includes(taxYear) ? taxYear : fallbackYear;
}
