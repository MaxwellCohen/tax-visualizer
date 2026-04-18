import type { TaxFormData } from "~/lib/taxForm.types";
import { SCENARIO_PRESETS } from "~/lib/taxScenario.presets.constants";
import { sanitizeScenarioInput } from "~/lib/taxScenario.sanitizeScenarioInput";
import type { ScenarioPreset } from "~/lib/taxScenario.types";
import { SCENARIO_QUERY_PARAM } from "./taxScenario.keys.constants";

export function serializeScenarioInput(input: TaxFormData): string {
  return JSON.stringify(input.rows);
}


export function deserializeScenarioInputFromSearchParams(searchParams: Record<string, string>): TaxFormData | null {
  const scenarioData = searchParams[SCENARIO_QUERY_PARAM] || '';
  console.log("deserializeScenarioInputFromSearchParams", scenarioData);
  if (typeof scenarioData !== 'string') {
    return null;
  }
  try {
    const data = JSON.parse(decodeURIComponent(scenarioData));
    if (!Array.isArray(data)) {
      return null;
    }
    return {
      rows: data,
    } as TaxFormData;
  } catch {
    return null;
  }
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
