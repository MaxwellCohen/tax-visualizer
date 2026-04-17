import type { TaxFormData } from "~/lib/taxForm.types";
import { SCENARIO_PRESETS } from "~/lib/taxScenario.presets.constants";
import { sanitizeScenarioInput } from "~/lib/taxScenario.sanitizeScenarioInput";
import type { ScenarioPreset } from "~/lib/taxScenario.types";

export function serializeScenarioInput(input: TaxFormData): string {
  return JSON.stringify(input.rows);
}

export function deserializeScenarioInput(
  value: string,
  availableYears: number[],
  fallbackYear: number,
): TaxFormData | null {
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
  console.log("getScenarioPresets returning:", SCENARIO_PRESETS.length, "presets");
  return [...SCENARIO_PRESETS];
}
