import type { FilingStatus } from "~/lib/taxData";
import { FEDERAL_TAX_CREDIT_KIND_VALUES } from "~/lib/taxCalc.federalTaxCreditSource";
import { ITEMIZED_DEDUCTION_KIND_VALUES } from "~/lib/taxCalc.itemizedDeductionSource";
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
} from "~/lib/taxCalc.types";
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

const incomeKinds = new Set<IncomeKind>([
  "input-wages-wages",
  "input-ordinary-ordinary",
  "input-shortTermCapGains-shortTermCapGains",
  "input-longTermCapGains-longTermCapGains",
  "input-selfEmployment-selfEmployment",
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
  return incomeKinds.has(value as IncomeKind) ? (value as IncomeKind) : "input-ordinary-ordinary";
}

export function sanitizePretaxBenefitKind(value: unknown): PretaxBenefitKind {
  return pretaxBenefitKinds.has(value as PretaxBenefitKind)
    ? (value as PretaxBenefitKind)
    : "input-401k-preTax401kSpouse1";
}

export function sanitizeItemizedDeductionKind(value: unknown): ItemizedDeductionKind {
  return itemizedDeductionKinds.has(value as ItemizedDeductionKind)
    ? (value as ItemizedDeductionKind)
    : "otherItemized";
}

export function sanitizeFederalTaxCreditKind(value: unknown): FederalTaxCreditKind {
  return federalTaxCreditKinds.has(value as FederalTaxCreditKind)
    ? (value as FederalTaxCreditKind)
    : "otherFederalCredit-otherFederalCredit";
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
    incomeRows: [newIncomeRow({ kind: "input-wages-wages", amount: 90_000 })],
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
