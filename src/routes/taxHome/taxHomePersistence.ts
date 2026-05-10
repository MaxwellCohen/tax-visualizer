import type { TaxFormData } from "~/lib/tax/form/types";
import { serializeScenarioInput } from "~/lib/tax/scenario/serialize";
import { SCENARIO_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";


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

