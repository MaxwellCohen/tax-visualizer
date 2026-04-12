/**
 * Single entry point for federal + payroll modeling. Produces {@link TaxResult} consumed by the
 * summary table, Sankey, and Mekko; charts do not recompute tax—only layout and allocation rules.
 */
import { clampTaxFormData } from "~/lib/taxCalc.clamp";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import { runCalculationPipeline, buildTaxResultFromPipeline } from "~/lib/taxCalc.pipeline";
import { buildTaxWarnings } from "~/lib/config/taxItems";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { TaxResult } from "~/lib/taxForm.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { getTaxYearConfig } from "~/lib/taxData";
import { getTaxYearFromRows } from "~/lib/taxCalc.inputs";

export function calculateTaxes(raw: TaxFormData, config?: TaxYearConfig): TaxResult | null {
  const data = clampTaxFormData(raw);
  const taxYear = getTaxYearFromRows(data.rows);
  const taxConfig = config ?? getTaxYearConfig(taxYear);
  if (!taxConfig) {
    return null;
  }

  const normalizedInputs = rowsToTaxCalculationInputs(data.rows);
  const state = runCalculationPipeline(normalizedInputs, taxConfig);

  const warnings = buildTaxWarnings(state, normalizedInputs, taxConfig);
  state.warnings = warnings;

  return buildTaxResultFromPipeline(data.rows, state, warnings);
}
