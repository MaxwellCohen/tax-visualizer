import type { ChartStyle, ConfigItem } from "../types";

export const DEFAULT_CHART_STYLE: Required<ChartStyle> = {
  fill: "var(--color-chart-default)",
  stroke: "var(--color-sankey-link)",
};

export const TAX_CHART_STYLE: Required<ChartStyle> = {
  fill: "var(--color-chart-tax)",
  stroke: "var(--color-chart-tax)",
};

export function resolveChartStyle(item: Pick<ConfigItem, "chartStyle">): Required<ChartStyle> {
  return {
    fill: item.chartStyle?.fill ?? DEFAULT_CHART_STYLE.fill,
    stroke: item.chartStyle?.stroke ?? DEFAULT_CHART_STYLE.stroke,
  };
}
