import type { FilingStatus } from "~/lib/taxData";
import { newIncomeSource } from "~/lib/taxCalc.incomeSource";
import {
  FEDERAL_TAX_CREDIT_KIND_VALUES,
  newFederalTaxCreditSource,
} from "~/lib/taxCalc.federalTaxCreditSource";
import {
  ITEMIZED_DEDUCTION_KIND_VALUES,
  newItemizedDeductionSource,
} from "~/lib/taxCalc.itemizedDeductionSource";
import {
  emptyAggregatedPretax,
  PRETAX_BENEFIT_KIND_VALUES,
  pretaxScalarsToMinimalSources,
} from "~/lib/taxCalc.pretaxBenefitSource";
import type {
  FederalTaxCreditKind,
  IncomeKind,
  ItemizedDeductionKind,
  PretaxBenefitKind,
  TaxInput,
} from "~/lib/taxCalc.types";

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
  "selfEmployment",
]);

const pretaxBenefitKinds = new Set<PretaxBenefitKind>(PRETAX_BENEFIT_KIND_VALUES);

const itemizedDeductionKinds = new Set<ItemizedDeductionKind>(ITEMIZED_DEDUCTION_KIND_VALUES);

const federalTaxCreditKinds = new Set<FederalTaxCreditKind>(FEDERAL_TAX_CREDIT_KIND_VALUES);

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

export function sanitizeItemizedDeductionKind(value: unknown): ItemizedDeductionKind {
  return itemizedDeductionKinds.has(value as ItemizedDeductionKind)
    ? (value as ItemizedDeductionKind)
    : "otherItemized";
}

export function sanitizeFederalTaxCreditKind(value: unknown): FederalTaxCreditKind {
  return federalTaxCreditKinds.has(value as FederalTaxCreditKind)
    ? (value as FederalTaxCreditKind)
    : "otherFederalCredit";
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
    pretaxBenefitSources: pretaxScalarsToMinimalSources(emptyAggregatedPretax()),
    useItemizedDeductions: false,
    itemizedDeductions: [newItemizedDeductionSource()],
    federalTaxCredits: [newFederalTaxCreditSource()],
  };
}

export function normalizeTaxYear(rawTaxYear: unknown, availableYears: number[], fallbackYear: number): number {
  const taxYear = Number(rawTaxYear);
  return availableYears.includes(taxYear) ? taxYear : fallbackYear;
}
