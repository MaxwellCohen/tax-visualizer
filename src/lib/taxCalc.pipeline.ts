/**
 * Federal tax pipeline: form rows → {@link TaxCalculationState}; metric lines from
 * {@link CHART_METRICS_REGISTRY} via {@link computeTaxMetricLines}. Form rows are converted to
 * {@link TaxCalculationInputs} via `rowsToTaxCalculationInputs`.
 */
import type { TaxCalculationState } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { createInitialState } from "~/lib/taxConfig.types";
import { PIPELINE_COMPUTED_ROW_ORDER, chartMetricNumeric, computeTaxChartMetrics } from "~/lib/config/pipelineTaxResult.config";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import type { TaxChartMetrics, TaxComputedRow, TaxFormRow } from "~/lib/taxForm.types";

export { createInitialState } from "~/lib/taxConfig.types";
export type { TaxCalculationInputs, TaxCalculationState, TaxItemResult } from "~/lib/taxConfig.types";
export type { TaxYearConfig } from "~/lib/taxData.types";
export { computeTaxChartMetrics } from "~/lib/config/pipelineTaxResult.config";

export function runCalculationPipeline(rows: TaxFormRow[], config: TaxYearConfig): TaxCalculationState {
  const inputs = rowsToTaxCalculationInputs(rows);
  return createInitialState(inputs);
}

/** Serialize chart metrics to computed rows per {@link PIPELINE_COMPUTED_ROW_ORDER} (numeric values only). */
export function metricsToComputedRows(metrics: TaxChartMetrics): TaxComputedRow[] {
  const rows: TaxComputedRow[] = [];
  for (const key of PIPELINE_COMPUTED_ROW_ORDER) {
    rows.push({
      type: "computed",
      id: key,
      value: chartMetricNumeric(metrics, key),
    });
  }
  return rows;
}
