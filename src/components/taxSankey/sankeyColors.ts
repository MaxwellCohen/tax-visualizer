import type { ChartNode } from "~/components/taxSankey/chartTypes";

const DEFAULT_FILL = "var(--chart-default)";
const DEFAULT_STROKE = "var(--sankey-link)";


export function linkStroke(targetNode: ChartNode): string {
  return (targetNode as any).stroke ??  DEFAULT_STROKE;
}


export function nodeFill(node: ChartNode): string {
  const explicitFill = (node as any).fill;
  if (explicitFill) return explicitFill;
  
  return DEFAULT_FILL;
}