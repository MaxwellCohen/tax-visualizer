import {
  deserializeScenarioInput,
  serializeScenarioInput,
} from "~/lib/taxScenario";
import { fallbackScenario } from "~/lib/taxScenario.sanitizeHelpers";
import type { TaxFormData } from "~/lib/taxForm.types";

export function starterScenario(taxYear: number): TaxFormData {
  return fallbackScenario(taxYear);
}

export function cloneScenario(input: TaxFormData, availableYears: number[], fallbackYear: number): TaxFormData {
  return (
    deserializeScenarioInput(serializeScenarioInput(input), availableYears, fallbackYear) ??
    fallbackScenario(fallbackYear)
  );
}
