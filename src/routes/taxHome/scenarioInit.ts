import { deserializeScenarioInputFromSearchParams } from "~/lib/tax/scenario/serialize";
import { hasReadableScenarioParams, scenarioFromReadableParams } from "~/lib/tax/scenario/readableParams";
import { loadScenarioFromLocalStorage } from "~/lib/tax/scenario/scenarioLocalPersistence";
import { fallbackScenario } from "~/lib/tax/scenario/sanitizeHelpers";
import { SCENARIO_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";
import type { TaxFormData } from "~/lib/tax/form/types";

export function starterScenario(taxYear: number): TaxFormData {
  return fallbackScenario(taxYear);
}

/** URL scenario only (`scenario` JSON, else readable params) — localStorage is applied after hydration so SSR and the client match. */
export function resolveInitialScenario(
  searchParams: Record<string, string>,
  defaultYear: number,
): TaxFormData {
  return (
    deserializeScenarioInputFromSearchParams(searchParams) ??
    scenarioFromReadableParams(searchParams, defaultYear) ??
    starterScenario(defaultYear)
  );
}

export function storedScenarioIfNoUrl(searchParams: Record<string, string>): TaxFormData | null {
  if (searchParams[SCENARIO_QUERY_PARAM] || hasReadableScenarioParams(searchParams)) return null;
  return loadScenarioFromLocalStorage();
}

