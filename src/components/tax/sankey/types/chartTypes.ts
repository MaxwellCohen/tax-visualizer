import { sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyLinkMinimal, SankeyNodeMinimal } from "d3-sankey";
import type { ConfigLabels } from "~/lib/config/taxPage/types";

export interface ChartNode extends SankeyNodeMinimal<ChartNode, ChartLink> {
  id: string;
  labels: ConfigLabels;
  /** Extra context for the native tooltip (`<title>`). */
  description?: string;
  row: number;
  col: number;
  stroke?: string;
  fill?: string;
}

export interface ChartLink extends SankeyLinkMinimal<ChartNode, ChartLink> {
  source: string | ChartNode;
  target: string | ChartNode;
  row: number;
  col: number;
  value: number;
  stroke?: string;
  fill?: string;
}

/** d3-sankey horizontal tangents; avoids straight segments while keeping a left-to-right S-curve. */
export const sankeyLinkPath = sankeyLinkHorizontal<ChartNode, ChartLink>();