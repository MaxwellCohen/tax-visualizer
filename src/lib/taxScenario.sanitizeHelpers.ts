import type { FilingStatus } from "~/lib/taxData";
import { newIncomeSource } from "~/lib/taxCalc.incomeSource";
import { newPretaxBenefitSource } from "~/lib/taxCalc.pretaxBenefitSource";
import type { IncomeKind, PretaxBenefitKind, TaxInput } from "~/lib/taxCalc.types";

const DEFAULT_FILING_STATUS: FilingStatus = "single";

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

const pretaxBenefitKinds = new Set<PretaxBenefitKind>([
  "preTax401kSpouse1",
  "preTax401kSpouse2",
  "preTaxHsaSpouse1",
  "preTaxHsaSpouse2",
  "preTaxOther",
  "traditionalIraSpouse1",
  "traditionalIraSpouse2",
]);

export function sanitizeMoney(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric;
}

export function sanitizeIncomeKind(value: unknown): IncomeKind {
  return incomeKinds.has(value as IncomeKind) ? (value as IncomeKind) : "ordinary";
}

export function sanitizePretaxBenefitKind(value: unknown): PretaxBenefitKind {
  return pretaxBenefitKinds.has(value as PretaxBenefitKind)
    ? (value as PretaxBenefitKind)
    : "preTax401kSpouse1";
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
    pretaxBenefitSources: [newPretaxBenefitSource({ kind: "preTax401kSpouse1" })],
    useItemizedDeductions: false,
    itemizedDeductions: 0,
  };
}

export function normalizeTaxYear(rawTaxYear: unknown, availableYears: number[], fallbackYear: number): number {
  const taxYear = Number(rawTaxYear);
  return availableYears.includes(taxYear) ? taxYear : fallbackYear;
}
