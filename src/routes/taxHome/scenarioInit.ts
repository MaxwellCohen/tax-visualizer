import { deserializeScenarioInputFromSearchParams } from "~/lib/tax/scenario/serialize";
import { loadScenarioFromLocalStorage } from "~/lib/tax/scenario/scenarioLocalPersistence";
import { fallbackScenario } from "~/lib/tax/scenario/sanitizeHelpers";
import { SCENARIO_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";
import type { TaxFormData } from "~/lib/tax/form/types";

export function starterScenario(taxYear: number): TaxFormData {
  return fallbackScenario(taxYear);
}

/** URL scenario only — localStorage is applied after hydration so SSR and the client match. */
export function resolveInitialScenario(
  searchParams: Record<string, string>,
  defaultYear: number,
): TaxFormData {
  return deserializeScenarioInputFromSearchParams(searchParams) ?? starterScenario(defaultYear);
}

export function storedScenarioIfNoUrl(searchParams: Record<string, string>): TaxFormData | null {
  if (searchParams[SCENARIO_QUERY_PARAM]) return null;
  return loadScenarioFromLocalStorage();
}

