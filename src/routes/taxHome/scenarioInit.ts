import { deserializeScenarioInputFromSearchParams } from "~/lib/tax/scenario/serialize";
import { loadScenarioFromLocalStorage } from "~/lib/tax/scenario/scenarioLocalPersistence";
import { fallbackScenario } from "~/lib/tax/scenario/sanitizeHelpers";
import type { TaxFormData } from "~/lib/tax/form/types";

export function starterScenario(taxYear: number): TaxFormData {
  return fallbackScenario(taxYear);
}

/** URL scenario wins, then local backup, then starter for the tax year. */
export function resolveInitialScenario(
  searchParams: Record<string, string>,
  defaultYear: number,
): TaxFormData {
  return (
    deserializeScenarioInputFromSearchParams(searchParams) ??
    loadScenarioFromLocalStorage() ??
    starterScenario(defaultYear)
  );
}

