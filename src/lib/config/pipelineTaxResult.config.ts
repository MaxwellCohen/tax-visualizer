import type { TaxFormRow, TaxMetricComputedValue } from "~/lib/taxForm.types";
import type { TaxCalculationState } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { chartMetricNumeric } from "~/lib/taxChartMetricRead";
import { getConfigItems } from"./page/Page.config";

/** Canonical chart-metric key order - now derived from getConfigItems */
export function getPipelineComputedRowOrder(taxData: TaxYearConfig, filingStatus: string): string[] {
  const items = getConfigItems(taxData, filingStatus as any);
  return items.map((i: any) => i.id);
}

export const SEGMENT_METADATA_ROW_IDS = new Set<string>();

/** All registry metric keys for resolve / exhaustiveness checks. */
export function getTaxChartMetricsKeys(taxData: TaxYearConfig, filingStatus: string): string[] {
  return getPipelineComputedRowOrder(taxData, filingStatus);
}

export { chartMetricNumeric };

/** Folded metrics from form rows + state (prefer TaxResult.metricLines in app code). */
export function computeTaxChartMetrics(
  inputs: TaxFormRow[],
  state: TaxCalculationState,
  config: TaxYearConfig,
): Partial<Record<string, TaxMetricComputedValue>> {
  const { computeTaxChartMetricsFromConfig } = require("./chartMetricsRegistry");
  return computeTaxChartMetricsFromConfig(inputs, state, config);
}