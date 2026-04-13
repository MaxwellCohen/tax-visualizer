import { DISPLAY_ITEMS_CONFIG } from "~/lib/config/chartMetricsRegistry";
import { chartMetricNumeric } from "~/lib/taxChartMetricRead";
import type { DisplayItem, TaxResult } from "~/lib/taxForm.types";

/** Detailed breakdown rows from registry `detailedDisplay` metadata and {@link TaxResult}. */
export function buildDisplayItems(result: TaxResult): DisplayItem[] {
  const displayItems: DisplayItem[] = [];
  for (const config of DISPLAY_ITEMS_CONFIG) {
    const amount = chartMetricNumeric(result, config.metricsKey);
    displayItems.push({
      type: config.type,
      amount,
      label: config.label,
      category: config.category,
      color: config.color,
      format: config.format,
      order: config.order,
      tooltip: config.tooltip,
      highlight: config.highlight,
    });
  }
  return displayItems.sort((a, b) => a.order - b.order);
}
