
import { fallbackScenario } from "~/lib/tax/scenario/sanitizeHelpers";
import type { TaxFormData } from "~/lib/tax/form/types";

export function starterScenario(taxYear: number): TaxFormData {
  return fallbackScenario(taxYear);
}

