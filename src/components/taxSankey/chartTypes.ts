import { sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyLinkMinimal, SankeyNodeMinimal } from "d3-sankey";
import type { SankeyChartNode } from "~/lib/taxCharts";

export interface ChartNode extends SankeyNodeMinimal<ChartNode, ChartLink>, SankeyChartNode {}

export interface ChartLink extends SankeyLinkMinimal<ChartNode, ChartLink> {
  source: string | ChartNode;
  target: string | ChartNode;
  value: number;
}

/** d3-sankey horizontal tangents; avoids straight segments while keeping a left-to-right S-curve. */
export const sankeyLinkPath = sankeyLinkHorizontal<ChartNode, ChartLink>();
