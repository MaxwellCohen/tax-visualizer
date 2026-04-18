import type { TaxFormData } from "~/lib/taxForm.types";
import {
  
  serializeScenarioInput,
} from "~/lib/taxScenario";
import {
  SCENARIO_QUERY_PARAM,
} from "~/lib/taxScenario.keys.constants"


/** Max total URL length before dropping the scenario query param (browser/practical limits). */
export const MAX_SCENARIO_URL_LENGTH = 10_000;


/**
 * Builds a full URL string with the serialized scenario, mirroring address-bar update rules.
 * Use for share links so the clipboard matches what `applyScenarioToUrl` would set.
 */
export function buildUrlWithScenario(baseHref: string, input: TaxFormData): string {
  const encoded = serializeScenarioInput(input);
  const url = new URL(baseHref);
  url.searchParams.set(SCENARIO_QUERY_PARAM, encoded);
  if (url.toString().length > MAX_SCENARIO_URL_LENGTH) {
    url.searchParams.delete(SCENARIO_QUERY_PARAM);
  }
  return url.toString();
}

