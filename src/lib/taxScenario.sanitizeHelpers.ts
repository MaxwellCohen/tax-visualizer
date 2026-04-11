import type { FilingStatus } from "~/lib/taxData";
import { newIncomeSource } from "~/lib/taxCalc.incomeSource";
import type { IncomeKind, TaxInput } from "~/lib/taxCalc.types";

export const DEFAULT_FILING_STATUS: FilingStatus = "single";

const filingStatuses = new Set<FilingStatus>([
  "single",
  "marriedJoint",
  "marriedSeparate",
  "headOfHousehold",
]);

const incomeKinds = new Set<IncomeKind>([
  "wages",
  "ordinary",
  "shortTermCapGains",
  "longTermCapGains",
]);

export function sanitizeMoney(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric;
}

export function sanitizeIncomeKind(value: unknown): IncomeKind {
  return incomeKinds.has(value as IncomeKind) ? (value as IncomeKind) : "ordinary";
}

export function sanitizeFilingStatus(value: unknown): FilingStatus {
  return filingStatuses.has(value as FilingStatus)
    ? (value as FilingStatus)
    : DEFAULT_FILING_STATUS;
}

export function fallbackScenario(fallbackYear: number): TaxInput {
  return {
    taxYear: fallbackYear,
    filingStatus: DEFAULT_FILING_STATUS,
    incomeSources: [newIncomeSource({ kind: "wages", amount: 90_000 })],
    preTax401kSpouse1: 0,
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
    useItemizedDeductions: false,
    itemizedDeductions: 0,
  };
}

export function normalizeTaxYear(rawTaxYear: unknown, availableYears: number[], fallbackYear: number): number {
  const taxYear = Number(rawTaxYear);
  return availableYears.includes(taxYear) ? taxYear : fallbackYear;
}
