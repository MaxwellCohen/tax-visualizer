import type { TaxFormRow, TaxMetricComputedValue } from "~/lib/taxForm.types";
import type { TaxCalculationState } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { chartMetricNumeric } from "~/lib/taxChartMetricRead";
import {
  PIPELINE_COMPUTED_ROW_ORDER_FULL_FROM_REGISTRY,
  SEGMENT_METRIC_KEYS_FROM_REGISTRY,
  TAX_CHART_METRICS_KEYS_FROM_REGISTRY,
  computeTaxChartMetricsFromRegistry,
} from "~/lib/config/chartMetricsRegistry";

/** Canonical chart-metric key order (matches {@link TAX_CALC_REGISTRY}). */
export const PIPELINE_COMPUTED_ROW_ORDER = PIPELINE_COMPUTED_ROW_ORDER_FULL_FROM_REGISTRY;

export const SEGMENT_METADATA_ROW_IDS = SEGMENT_METRIC_KEYS_FROM_REGISTRY;

/** All registry metric keys for resolve / exhaustiveness checks. */
export const TAX_CHART_METRICS_KEYS = TAX_CHART_METRICS_KEYS_FROM_REGISTRY;

export { chartMetricNumeric };

export { TAX_CALC_REGISTRY } from "~/lib/config/TAX_CALC_REGISTRY";
export type { ChartRegistryEntry, ChartMetricRegistryEntry, ChartMetricComputeContext } from "~/lib/config/chartMetricsRegistry";

/** Folded metrics from form rows + state (prefer {@link TaxResult.metricLines} in app code). */
export function computeTaxChartMetrics(
  inputs: TaxFormRow[],
  state: TaxCalculationState,
  config: TaxYearConfig,
): Partial<Record<string, TaxMetricComputedValue>> {
  return computeTaxChartMetricsFromRegistry(inputs, state, config);
}
