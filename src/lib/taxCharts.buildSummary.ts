import { asSummaryChartRole, getSummaryChartRoleLabel, type SummaryChartRole } from "~/lib/config/page/chartRole";
import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";

export type SummaryMetricFormat = "currency" | "percent" | "number";

export type SummaryMetric = {
  id: string;
  label: string;
  chartRole: SummaryChartRole;
  value: number;
  format: SummaryMetricFormat;
  highlight: boolean;
  displayOrder: number;
};

 type SummarySection = {
  chartRole: SummaryChartRole;
  label: string;
  metrics: SummaryMetric[];
};

 type SummaryChartData = {
  sections: SummarySection[];
};

function compareSummaryMetrics(a: SummaryMetric, b: SummaryMetric): number {
  return a.displayOrder - b.displayOrder || a.id.localeCompare(b.id);
}

function metricFromCalculatedItem(item: CalculatedConfigItem): SummaryMetric | undefined {
  const summary = item.summary;
  const chartRole = asSummaryChartRole(item.chartRole);
  if (!summary || (summary.hideWhenZero && item.computedValue === 0)) return undefined;
  if (!chartRole) return undefined;

  return {
    id: item.id,
    label: item.labels.summary ?? item.labels.default,
    chartRole,
    value: item.computedValue,
    format: summary.format ?? "number",
    highlight: summary.highlight ?? false,
    displayOrder: summary.displayOrder,
  };
}

export function buildSummaryFromConfig(cc: CalculatedConfigItem[]): SummaryChartData | undefined {
  const metrics = cc
    .map(metricFromCalculatedItem)
    .filter((metric): metric is SummaryMetric => metric != null)
    .sort(compareSummaryMetrics);

  if (!metrics.length || metrics.every((metric) => metric.value === 0)) return undefined;

  const sectionsByChartRole = new Map<SummaryChartRole, SummaryMetric[]>();
  for (const metric of metrics) {
    const sectionMetrics = sectionsByChartRole.get(metric.chartRole) ?? [];
    sectionMetrics.push(metric);
    sectionsByChartRole.set(metric.chartRole, sectionMetrics);
  }

  return {
    sections: Array.from(sectionsByChartRole.entries()).map(([chartRole, sectionMetrics]) => ({
      chartRole,
      label: getSummaryChartRoleLabel(chartRole),
      metrics: sectionMetrics,
    })),
  };
}
