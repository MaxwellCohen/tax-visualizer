import type { TaxFormData } from "~/lib/tax/form/types";
import { SCENARIO_PRESETS } from "~/lib/tax/scenario/presets.constants";
import type { ScenarioPreset } from "~/lib/tax/scenario/types";
import { SCENARIO_QUERY_PARAM } from "./keys.constants";

export function serializeScenarioInput(input: TaxFormData): string {
  return JSON.stringify(input.rows);
}

export function deserializeScenarioInputFromSearchParams(searchParams: Record<string, string>): TaxFormData | null {
  const scenarioData = searchParams[SCENARIO_QUERY_PARAM] || '';
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
  return [...SCENARIO_PRESETS];
}
