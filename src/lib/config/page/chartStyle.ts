import type { ChartStyle, ConfigItem } from "./pageConfig.types";

export const DEFAULT_CHART_STYLE: Required<ChartStyle> = {
  fill: "var(--chart-default)",
  stroke: "var(--sankey-link)",
};

export const TAX_CHART_STYLE: Required<ChartStyle> = {
  fill: "var(--chart-tax)",
  stroke: "var(--chart-tax)",
};

export function resolveChartStyle(item: Pick<ConfigItem, "chartStyle">): Required<ChartStyle> {
  return {
    fill: item.chartStyle?.fill ?? DEFAULT_CHART_STYLE.fill,
    stroke: item.chartStyle?.stroke ?? DEFAULT_CHART_STYLE.stroke,
  };
}
