import type { TaxInput } from "~/lib/taxCalc.types";
import { SCENARIO_PRESETS } from "~/lib/taxScenario.presets.constants";
import { sanitizeScenarioInput } from "~/lib/taxScenario.sanitizeScenarioInput";
import type { ScenarioPreset, SerializedScenarioV3 } from "~/lib/taxScenario.types";

export function serializeScenarioInput(input: TaxInput): string {
  const payload: SerializedScenarioV3 = {
    version: 3,
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: input.incomeSources.map(source => ({
      id: source.id,
      kind: source.kind,
      label: source.label,
      amount: source.amount,
    })),
    pretaxBenefitSources: input.pretaxBenefitSources.map(row => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      amount: row.amount,
    })),
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
