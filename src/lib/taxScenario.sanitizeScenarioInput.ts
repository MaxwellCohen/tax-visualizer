import { clampTaxInputPretaxToLimits } from "~/lib/taxCalc.clamp";
import type { TaxInput } from "~/lib/taxCalc.types";
import type { PretaxBenefitSource } from "~/lib/taxCalc.pretaxBenefitSource";
import { pretaxScalarsToMinimalSources } from "~/lib/taxCalc.pretaxBenefitSource";
import {
  fallbackScenario,
  normalizeTaxYear,
  sanitizeFilingStatus,
  sanitizeIncomeKind,
  sanitizeMoney,
  sanitizePretaxBenefitKind,
} from "~/lib/taxScenario.sanitizeHelpers";
import type {
  SerializedScenario,
  SerializedScenarioV1,
  SerializedScenarioV2,
  SerializedScenarioV3,
} from "~/lib/taxScenario.types";

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

function buildTaxInputCore(
  taxYear: number,
  filingStatus: TaxInput["filingStatus"],
  incomeSources: TaxInput["incomeSources"],
  pretaxBenefitSources: TaxInput["pretaxBenefitSources"],
  useItemizedDeductions: boolean,
  itemizedDeductions: number,
): TaxInput {
  return clampTaxInputPretaxToLimits({
    taxYear,
    filingStatus,
    incomeSources,
    pretaxBenefitSources,
    useItemizedDeductions,
    itemizedDeductions,
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

  if (raw.version === 3) {
    const v3 = raw as Partial<SerializedScenarioV3>;
    const pretaxBenefitSources = sanitizePretaxBenefitSourcesList(v3.pretaxBenefitSources, fb.pretaxBenefitSources);
    return buildTaxInputCore(
      taxYear,
      sanitizeFilingStatus(raw.filingStatus),
      incomeSources,
      pretaxBenefitSources,
      Boolean(raw.useItemizedDeductions),
      sanitizeMoney(raw.itemizedDeductions),
    );
  }

  const v2 = raw as Partial<SerializedScenarioV2>;
  if (raw.version === 2) {
    const agg = {
      preTax401kSpouse1: sanitizeMoney(v2.preTax401kSpouse1),
      preTax401kSpouse2: sanitizeMoney(v2.preTax401kSpouse2),
      preTaxHsaSpouse1: sanitizeMoney(v2.preTaxHsaSpouse1),
      preTaxHsaSpouse2: sanitizeMoney(v2.preTaxHsaSpouse2),
      preTaxOther: sanitizeMoney(v2.preTaxOther),
      traditionalIraSpouse1: sanitizeMoney(v2.traditionalIraSpouse1 ?? 0),
      traditionalIraSpouse2: sanitizeMoney(v2.traditionalIraSpouse2 ?? 0),
    };
    const pretaxBenefitSources = pretaxScalarsToMinimalSources(agg);
    return buildTaxInputCore(
      taxYear,
      sanitizeFilingStatus(raw.filingStatus),
      incomeSources,
      pretaxBenefitSources,
      Boolean(raw.useItemizedDeductions),
      sanitizeMoney(raw.itemizedDeductions),
    );
  }

  const v1 = raw as SerializedScenarioV1;
  const agg = {
    preTax401kSpouse1: sanitizeMoney(v1.preTax401k),
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: sanitizeMoney(v1.preTaxHsa),
    preTaxHsaSpouse2: 0,
    preTaxOther: sanitizeMoney(v1.preTaxOther),
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
  };
  const pretaxBenefitSources = pretaxScalarsToMinimalSources(agg);
  return buildTaxInputCore(
    taxYear,
    sanitizeFilingStatus(raw.filingStatus),
    incomeSources,
    pretaxBenefitSources,
    Boolean(raw.useItemizedDeductions),
    sanitizeMoney(raw.itemizedDeductions),
  );
}
