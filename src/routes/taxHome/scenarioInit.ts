
import { fallbackScenario } from "~/lib/taxScenario.sanitizeHelpers";
import type { TaxFormData } from "~/lib/taxForm.types";

export function starterScenario(taxYear: number): TaxFormData {
  return fallbackScenario(taxYear);
}

