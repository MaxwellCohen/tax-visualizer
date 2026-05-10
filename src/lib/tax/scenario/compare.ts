import { getTaxYearFromRows, rowsToTaxCalculationInputs } from "~/lib/tax/calc/inputs";
import type { TaxFormData } from "~/lib/tax/form/types";
import type { ScenarioPreset } from "~/lib/tax/scenario/types";

function taxFormSignature(input: TaxFormData): string {
  return JSON.stringify(rowsToTaxCalculationInputs(input.rows));
}

export function taxInputMatchesPreset(current: TaxFormData, preset: ScenarioPreset): boolean {
  const year = getTaxYearFromRows(current.rows);
  return taxFormSignature(current) === taxFormSignature(preset.buildInput(year));
}
