import type { SankeyCategory } from "~/lib/config/page/pageConfig.types";
import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";

export type SummaryMetricFormat = "currency" | "percent" | "number";

export type SummaryMetric = {
  id: string;
  summaryId: string;
  label: string;
  category: SankeyCategory;
  value: number;
  format: SummaryMetricFormat;
  highlight: boolean;
  displayOrder: number;
};

 type SummarySection = {
  category: SankeyCategory;
  label: string;
  metrics: SummaryMetric[];
};

 type SummaryChartData = {
  sections: SummarySection[];
};

const SUMMARY_SECTION_LABELS: Record<SankeyCategory, string> = {
  income: "Income",
  pretax: "Pre-tax",
  deduction: "Deductions",
  tax: "Taxes",
  credit: "Credits",
  summary: "Summary",
  takehome: "Take-home",
  rate: "Rates",
};

function compareSummaryMetrics(a: SummaryMetric, b: SummaryMetric): number {
  return a.displayOrder - b.displayOrder || a.id.localeCompare(b.id);
}

function shouldShowSummaryItem(item: CalculatedConfigItem): boolean {
  if (!item.summary) return false;
  return !(item.summary.hideWhenZero && item.computedValue === 0);
}

function metricFromCalculatedItem(item: CalculatedConfigItem): SummaryMetric {
  const summary = item.summary!;
  return {
    id: item.id,
    summaryId: summary.summaryId,
    label: summary.label,
    category: summary.category,
    value: item.computedValue,
    format: summary.format ?? "number",
    highlight: summary.highlight ?? false,
    displayOrder: summary.displayOrder,
  };
}

export function buildSummaryFromConfig(cc: CalculatedConfigItem[]): SummaryChartData | undefined {
  const metrics = cc
    .filter(shouldShowSummaryItem)
    .map(metricFromCalculatedItem)
    .sort(compareSummaryMetrics);

  if (!metrics.length || metrics.every((metric) => metric.value === 0)) return undefined;

  const sectionsByCategory = new Map<SankeyCategory, SummaryMetric[]>();
  for (const metric of metrics) {
    const sectionMetrics = sectionsByCategory.get(metric.category) ?? [];
    sectionMetrics.push(metric);
    sectionsByCategory.set(metric.category, sectionMetrics);
  }

  return {
    sections: Array.from(sectionsByCategory.entries()).map(([category, sectionMetrics]) => ({
      category,
      label: SUMMARY_SECTION_LABELS[category],
      metrics: sectionMetrics,
    })),
  };
}
