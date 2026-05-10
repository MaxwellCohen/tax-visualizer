import type { ChartNode } from "~/components/tax/sankey/types/chartTypes";
import { DEFAULT_CHART_STYLE } from "~/lib/config/taxPage/chart/chartStyle";


export function linkStroke(targetNode: ChartNode): string {
  return targetNode.stroke ?? DEFAULT_CHART_STYLE.stroke;
}


export function nodeFill(node: ChartNode): string {
  const explicitFill = node.fill;
  if (explicitFill) return explicitFill;
  
  return DEFAULT_CHART_STYLE.fill;
}