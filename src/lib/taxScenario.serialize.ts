import type { TaxFormData } from "~/lib/taxForm.types";
import { SCENARIO_PRESETS } from "~/lib/taxScenario.presets.constants";
import type { ScenarioPreset } from "~/lib/taxScenario.types";
import { SCENARIO_QUERY_PARAM } from "./taxScenario.keys.constants";

export function serializeScenarioInput(input: TaxFormData): string {
  return JSON.stringify(input.rows);
}

export function deserializeScenarioInputFromSearchParams(searchParams: Record<string, string>): TaxFormData | null {
  const scenarioData = searchParams[SCENARIO_QUERY_PARAM] || '';
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


export function getScenarioPresets(): ScenarioPreset[] {
  console.log("getScenarioPresets returning:", SCENARIO_PRESETS.length, "presets");
  return [...SCENARIO_PRESETS];
}
