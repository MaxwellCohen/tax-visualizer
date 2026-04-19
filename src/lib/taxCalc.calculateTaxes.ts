/**
 * Single entry point for federal + payroll modeling. Produces {@link TaxResult} consumed by the
 * summary table, Sankey, and Mekko; charts do not recompute tax—only layout and allocation rules.
 *
 * **Data flow (registry evaluation contract):**
 *
 * 1. Resolve tax rules only: {@link getTaxYearConfig} from the form’s tax year (no tax math).
 * 2. **Form data** + **{@link TaxYearConfig}** feed {@link computeTaxMetricLines}, which loops
 *    {@link TAX_CALC_REGISTRY} in order. Each `compute(ctx)` reads form rows, config, and
 *    {@link ChartMetricComputeContext.accreted} state filled by prior steps in the same pass.
 * 3. Row → {@link TaxCalculationInputs} via {@link rowsToTaxCalculationInputs} is normalization
 *    for the model, not a separate pipeline precompute (see `chartMetricsRegistry` module header).
 */
import type { TaxFormData } from "~/lib/taxForm.types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import { getConfigItems, type configItem } from "~/lib/config/page/Page.config";

export type CalculatedConfigItem = configItem & { computedValue: number };

export function calculateAllConfigValues(
  formData: TaxFormData,
  taxData: TaxYearConfig,
  filingStatus: FilingStatus
): CalculatedConfigItem[] {
  const items = getConfigItems(taxData, filingStatus);
  return items.map(item => ({
    ...item,
    computedValue: item.calculate?.(formData.rows, taxData, filingStatus) ?? 0,
  }));
}


