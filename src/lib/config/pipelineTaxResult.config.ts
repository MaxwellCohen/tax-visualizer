import type { DeductionKind } from "~/lib/taxCalc.types";
import type { TaxChartMetrics } from "~/lib/taxForm.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { TaxCalculationState } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import {
  CHART_METRICS_REGISTRY,
  PIPELINE_COMPUTED_ROW_ORDER_FULL_FROM_REGISTRY,
  SEGMENT_METRIC_KEYS_FROM_REGISTRY,
  TAX_CHART_METRICS_KEYS_FROM_REGISTRY,
  buildVisualizationMetricIdToChartKey,
  computeTaxChartMetricsFromRegistry,
} from "~/lib/config/chartMetricsRegistry";

/** Metrics not serialized as numeric {@link TaxComputedRow}s (registry `emitAsComputedRow: false`). */
export const CHART_METRICS_NOT_EMITTED_AS_COMPUTED_ROWS = new Set<keyof TaxChartMetrics>(
  CHART_METRICS_REGISTRY.filter((e) => !e.emitAsComputedRow).map((e) => e.metricsKey),
);

/** Full pipeline row order (includes non-serialized keys for ordering). */
const PIPELINE_COMPUTED_ROW_ORDER_FULL = PIPELINE_COMPUTED_ROW_ORDER_FULL_FROM_REGISTRY;

/** Canonical order for appending computed rows (`emitAsComputedRow` only). */
export const PIPELINE_COMPUTED_ROW_ORDER = CHART_METRICS_REGISTRY.filter((e) => e.emitAsComputedRow).map(
  (e) => e.metricsKey,
) as unknown as readonly (keyof TaxChartMetrics)[];

/** Row ids whose `value` is often 0 but must still be indexed (legacy; segment arrays are not serialized as rows). */
const TAX_RESULT_ROW_IDS_KEEP_WHEN_VALUE_ZERO = [] as const;

export const SEGMENT_METADATA_ROW_IDS = SEGMENT_METRIC_KEYS_FROM_REGISTRY;

/** All {@link TaxChartMetrics} keys for resolve / exhaustiveness checks. */
export const TAX_CHART_METRICS_KEYS = TAX_CHART_METRICS_KEYS_FROM_REGISTRY;

/** Visualization metric id → {@link TaxChartMetrics} key (built from registry `visualizationSourceId`). */
const VISUALIZATION_METRIC_ID_TO_CHART_KEY: Partial<Record<string, keyof TaxChartMetrics>> =
  buildVisualizationMetricIdToChartKey();

export function chartMetricNumeric(m: TaxChartMetrics, key: keyof TaxChartMetrics): number {
  const v = m[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function deductionKindFromInputs(useItemized: boolean): DeductionKind {
  return useItemized ? "itemized" : "standard";
}

export { CHART_METRICS_REGISTRY } from "~/lib/config/chartMetricsRegistry";
export type { ChartMetricRegistryEntry, ChartMetricComputeContext } from "~/lib/config/chartMetricsRegistry";

/** Builds {@link TaxChartMetrics} from form rows + state via {@link CHART_METRICS_REGISTRY} (pipeline built inside). */
export function computeTaxChartMetrics(
  inputs: TaxFormRow[],
  state: TaxCalculationState,
  config: TaxYearConfig,
): TaxChartMetrics {
  return computeTaxChartMetricsFromRegistry(inputs, state, config);
}
