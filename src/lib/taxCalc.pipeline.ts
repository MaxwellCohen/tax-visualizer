/**
 * Federal tax pipeline: form rows → {@link TaxCalculationState}; metric lines from
 * {@link CHART_REGISTRY} via {@link computeTaxMetricLines}. Form rows are converted to
 * {@link TaxCalculationInputs} via `rowsToTaxCalculationInputs`.
 */
import type { TaxCalculationState } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { createInitialState } from "~/lib/taxConfig.types";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import type { TaxSegment } from "~/lib/taxCalc.types";
import type { TaxComputedRow, TaxComputedSegmentRow, TaxFormRow, TaxMetricLine } from "~/lib/taxForm.types";

export { createInitialState } from "~/lib/taxConfig.types";
export type { TaxCalculationInputs, TaxCalculationState, TaxItemResult } from "~/lib/taxConfig.types";
export type { TaxYearConfig } from "~/lib/taxData.types";
export { computeTaxChartMetrics } from "~/lib/config/pipelineTaxResult.config";

export function runCalculationPipeline(rows: TaxFormRow[], config: TaxYearConfig): TaxCalculationState {
  const inputs = rowsToTaxCalculationInputs(rows);
  return createInitialState(inputs);
}

export type TaxSerializedPipelineRow = TaxComputedRow | TaxComputedSegmentRow;

/** Serialize pipeline metric lines onto {@link TaxResult.rows} (same order as {@link TaxMetricLine}[]). */
export function metricLinesToComputedRows(lines: readonly TaxMetricLine[]): TaxSerializedPipelineRow[] {
  const rows: TaxSerializedPipelineRow[] = [];
  for (const line of lines) {
    if (line.valueKind === "segments") {
      rows.push({
        type: "computed-segments",
        id: line.metricsKey,
        segments: Array.isArray(line.value) ? (line.value as TaxSegment[]) : [],
      });
    } else if (line.valueKind === "number") {
      const v = line.value;
      rows.push({
        type: "computed",
        id: line.metricsKey,
        value: typeof v === "number" && Number.isFinite(v) ? v : 0,
      });
    }
  }
  return rows;
}
