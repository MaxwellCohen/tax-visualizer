/**
 * Federal tax pipeline: form rows → {@link TaxCalculationState}; metric lines from
 * {@link CHART_REGISTRY} via {@link computeTaxMetricLines}. Form rows are converted to
 * {@link TaxCalculationInputs} via `rowsToTaxCalculationInputs`.
 */
import type { TaxCalculationState } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { createInitialState } from "~/lib/taxConfig.types";
import { CHART_REGISTRY } from "~/lib/config/chartMetricsRegistry";
import { chartMetricNumeric, computeTaxChartMetrics } from "~/lib/config/pipelineTaxResult.config";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import type { TaxSegment } from "~/lib/taxCalc.types";
import type { TaxChartMetrics, TaxComputedRow, TaxComputedSegmentRow, TaxFormRow } from "~/lib/taxForm.types";

export { createInitialState } from "~/lib/taxConfig.types";
export type { TaxCalculationInputs, TaxCalculationState, TaxItemResult } from "~/lib/taxConfig.types";
export type { TaxYearConfig } from "~/lib/taxData.types";
export { computeTaxChartMetrics } from "~/lib/config/pipelineTaxResult.config";

export function runCalculationPipeline(rows: TaxFormRow[], config: TaxYearConfig): TaxCalculationState {
  const inputs = rowsToTaxCalculationInputs(rows);
  return createInitialState(inputs);
}

export type TaxSerializedPipelineRow = TaxComputedRow | TaxComputedSegmentRow;

/** Serialize chart metrics to result rows ({@link CHART_REGISTRY} order; segment metrics use {@link TaxComputedSegmentRow}). */
export function metricsToComputedRows(metrics: TaxChartMetrics): TaxSerializedPipelineRow[] {
  const rows: TaxSerializedPipelineRow[] = [];
  for (const entry of CHART_REGISTRY) {
    const key = entry.metricsKey;
    if (entry.valueKind === "segments") {
      rows.push({
        type: "computed-segments",
        id: key,
        segments: Array.isArray(metrics[key]) ? (metrics[key] as TaxSegment[]) : [],
      });
    } else {
      rows.push({
        type: "computed",
        id: key,
        value: chartMetricNumeric(metrics, key),
      });
    }
  }
  return rows;
}
