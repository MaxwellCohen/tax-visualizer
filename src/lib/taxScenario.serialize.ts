import type { TaxInput } from "~/lib/taxCalc.types";
import { SCENARIO_PRESETS } from "~/lib/taxScenario.presets.constants";
import { sanitizeScenarioInput } from "~/lib/taxScenario.sanitizeScenarioInput";
import type { ScenarioPreset, SerializedScenarioV2 } from "~/lib/taxScenario.types";

export function serializeScenarioInput(input: TaxInput): string {
  const payload: SerializedScenarioV2 = {
    version: 2,
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: input.incomeSources.map(source => ({
      id: source.id,
      kind: source.kind,
      label: source.label,
      amount: source.amount,
    })),
    preTax401kSpouse1: input.preTax401kSpouse1,
    preTax401kSpouse2: input.preTax401kSpouse2,
    preTaxHsaSpouse1: input.preTaxHsaSpouse1,
    preTaxHsaSpouse2: input.preTaxHsaSpouse2,
    preTaxOther: input.preTaxOther,
    traditionalIraSpouse1: input.traditionalIraSpouse1,
    traditionalIraSpouse2: input.traditionalIraSpouse2,
    useItemizedDeductions: input.useItemizedDeductions,
    itemizedDeductions: input.itemizedDeductions,
  };
  return JSON.stringify(payload);
}

export function deserializeScenarioInput(
  value: string,
  availableYears: number[],
  fallbackYear: number,
): TaxInput | null {
  try {
    return sanitizeScenarioInput(JSON.parse(value), availableYears, fallbackYear);
  } catch {
    try {
      return sanitizeScenarioInput(
        JSON.parse(decodeURIComponent(value)),
        availableYears,
        fallbackYear,
      );
    } catch {
      return null;
    }
  }
}

export function getScenarioPresets(): ScenarioPreset[] {
  return SCENARIO_PRESETS;
}
