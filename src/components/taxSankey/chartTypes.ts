import { sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyLinkMinimal, SankeyNodeMinimal } from "d3-sankey";
import type { SankeyChartNode } from "~/lib/taxCharts";

export interface ChartNode extends SankeyNodeMinimal<ChartNode, ChartLink>, SankeyChartNode {
  row: number;
  col: number;
}

export interface ChartLink extends SankeyLinkMinimal<ChartNode, ChartLink> {
  source: string | ChartNode;
  target: string | ChartNode;
  row: number;
  col: number;
  value: number;
}

/** d3-sankey horizontal tangents; avoids straight segments while keeping a left-to-right S-curve. */
export const sankeyLinkPath = sankeyLinkHorizontal<ChartNode, ChartLink>();
