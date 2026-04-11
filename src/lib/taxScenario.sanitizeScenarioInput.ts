import { clampTaxInputPretaxToLimits } from "~/lib/taxCalc.clamp";
import type { TaxInput } from "~/lib/taxCalc.types";
import {
  fallbackScenario,
  normalizeTaxYear,
  sanitizeFilingStatus,
  sanitizeIncomeKind,
  sanitizeMoney,
} from "~/lib/taxScenario.sanitizeHelpers";
import type {
  SerializedScenario,
  SerializedScenarioV1,
  SerializedScenarioV2,
} from "~/lib/taxScenario.types";

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
  const incomeSources =
    Array.isArray(raw.incomeSources) && raw.incomeSources.length > 0
      ? raw.incomeSources.map((source, index) => ({
          id: typeof source?.id === "string" && source.id.trim() ? source.id : `shared-${index}`,
          kind: sanitizeIncomeKind(source?.kind),
          label: typeof source?.label === "string" ? source.label : "",
          amount: sanitizeMoney(source?.amount),
        }))
      : fallbackScenario(taxYear).incomeSources;

  const v2 = raw as Partial<SerializedScenarioV2>;
  if (raw.version === 2) {
    return clampTaxInputPretaxToLimits({
      taxYear,
      filingStatus: sanitizeFilingStatus(raw.filingStatus),
      incomeSources,
      preTax401kSpouse1: sanitizeMoney(v2.preTax401kSpouse1),
      preTax401kSpouse2: sanitizeMoney(v2.preTax401kSpouse2),
      preTaxHsaSpouse1: sanitizeMoney(v2.preTaxHsaSpouse1),
      preTaxHsaSpouse2: sanitizeMoney(v2.preTaxHsaSpouse2),
      preTaxOther: sanitizeMoney(v2.preTaxOther),
      traditionalIraSpouse1: sanitizeMoney(v2.traditionalIraSpouse1),
      traditionalIraSpouse2: sanitizeMoney(v2.traditionalIraSpouse2),
      useItemizedDeductions: Boolean(raw.useItemizedDeductions),
      itemizedDeductions: sanitizeMoney(raw.itemizedDeductions),
    });
  }

  const v1 = raw as SerializedScenarioV1;
  return clampTaxInputPretaxToLimits({
    taxYear,
    filingStatus: sanitizeFilingStatus(raw.filingStatus),
    incomeSources,
    preTax401kSpouse1: sanitizeMoney(v1.preTax401k),
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: sanitizeMoney(v1.preTaxHsa),
    preTaxHsaSpouse2: 0,
    preTaxOther: sanitizeMoney(v1.preTaxOther),
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
    useItemizedDeductions: Boolean(raw.useItemizedDeductions),
    itemizedDeductions: sanitizeMoney(raw.itemizedDeductions),
  });
}
