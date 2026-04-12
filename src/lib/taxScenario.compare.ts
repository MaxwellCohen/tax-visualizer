import { getTaxYearFromRows, rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { ScenarioPreset } from "~/lib/taxScenario.types";

function taxFormSignature(input: TaxFormData): string {
  return JSON.stringify(rowsToTaxCalculationInputs(input.rows));
}

export function taxInputMatchesPreset(current: TaxFormData, preset: ScenarioPreset): boolean {
  const year = getTaxYearFromRows(current.rows);
  return taxFormSignature(current) === taxFormSignature(preset.buildInput(year));
}
