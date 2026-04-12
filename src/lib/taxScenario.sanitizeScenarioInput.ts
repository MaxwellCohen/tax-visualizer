import { clampTaxInputToYearLimits } from "~/lib/taxCalc.clamp";
import type { TaxInput, FederalTaxCreditSource, ItemizedDeductionSource, PretaxBenefitSource } from "~/lib/taxCalc.types";
import {
  fallbackScenario,
  normalizeTaxYear,
  sanitizeFilingStatus,
  sanitizeIncomeKind,
  sanitizeMoney,
  sanitizeFederalTaxCreditKind,
  sanitizeItemizedDeductionKind,
  sanitizePretaxBenefitKind,
} from "~/lib/taxScenario.sanitizeHelpers";
import type { SerializedScenario } from "~/lib/taxScenario.types";

function sanitizePretaxBenefitSourcesList(
  raw: unknown,
  fallback: PretaxBenefitSource[],
): PretaxBenefitSource[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((row, index) => ({
    id: typeof row?.id === "string" && row.id.trim() ? row.id : `ptx-${index}`,
    kind: sanitizePretaxBenefitKind(row?.kind),
    label: typeof row?.label === "string" ? row.label : "",
    amount: sanitizeMoney(row?.amount),
  }));
}

function sanitizeFederalTaxCreditSourcesList(
  raw: unknown,
  fallback: FederalTaxCreditSource[],
): FederalTaxCreditSource[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback.map(r => ({ ...r }));
  return raw.map((row, index) => ({
    id: typeof row?.id === "string" && row.id.trim() ? row.id : `ftc-${index}`,
    kind: sanitizeFederalTaxCreditKind(row?.kind),
    label: typeof row?.label === "string" ? row.label : "",
    amount: sanitizeMoney(row?.amount),
  }));
}

function sanitizeItemizedDeductionSourcesList(
  raw: unknown,
  fallback: ItemizedDeductionSource[],
): ItemizedDeductionSource[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback.map(r => ({ ...r }));
  return raw.map((row, index) => ({
    id: typeof row?.id === "string" && row.id.trim() ? row.id : `itm-${index}`,
    kind: sanitizeItemizedDeductionKind(row?.kind),
    label: typeof row?.label === "string" ? row.label : "",
    amount: sanitizeMoney(row?.amount),
  }));
}

function buildTaxInputCore(
  taxYear: number,
  filingStatus: TaxInput["filingStatus"],
  incomeSources: TaxInput["incomeSources"],
  pretaxBenefitSources: TaxInput["pretaxBenefitSources"],
  useItemizedDeductions: boolean,
  itemizedDeductions: ItemizedDeductionSource[],
  federalTaxCredits: FederalTaxCreditSource[],
): TaxInput {
  return clampTaxInputToYearLimits({
    taxYear,
    filingStatus,
    incomeSources,
    pretaxBenefitSources,
    useItemizedDeductions,
    itemizedDeductions,
    federalTaxCredits,
  });
}

export function sanitizeScenarioInput(
  rawValue: unknown,
  availableYears: number[],
  fallbackYear: number,
): TaxInput {
  if (rawValue == null || typeof rawValue !== "object") {
    return fallbackScenario(fallbackYear);
  }

  const raw = rawValue as Partial<SerializedScenario>;
  const taxYear = normalizeTaxYear(raw.taxYear, availableYears, fallbackYear);

  if (raw.version !== 4) {
    return fallbackScenario(taxYear);
  }

  const incomeSources =
    Array.isArray(raw.incomeSources) && raw.incomeSources.length > 0
      ? raw.incomeSources.map((source, index) => ({
          id: typeof source?.id === "string" && source.id.trim() ? source.id : `shared-${index}`,
          kind: sanitizeIncomeKind(source?.kind),
          label: typeof source?.label === "string" ? source.label : "",
          amount: sanitizeMoney(source?.amount),
        }))
      : fallbackScenario(taxYear).incomeSources;

  const fb = fallbackScenario(taxYear);
  const pretaxBenefitSources = sanitizePretaxBenefitSourcesList(raw.pretaxBenefitSources, fb.pretaxBenefitSources);
  const itemizedDeductions = sanitizeItemizedDeductionSourcesList(raw.itemizedDeductions, fb.itemizedDeductions);
  const federalTaxCredits = sanitizeFederalTaxCreditSourcesList(raw.federalTaxCredits, fb.federalTaxCredits);

  return buildTaxInputCore(
    taxYear,
    sanitizeFilingStatus(raw.filingStatus),
    incomeSources,
    pretaxBenefitSources,
    Boolean(raw.useItemizedDeductions),
    itemizedDeductions,
    federalTaxCredits,
  );
}
