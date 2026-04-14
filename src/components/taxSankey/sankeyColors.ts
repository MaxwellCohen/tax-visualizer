import type { ChartNode } from "~/components/taxSankey/chartTypes";

const DEFAULT_FILL = "var(--sankey-node-7)";
const DEFAULT_STROKE = "var(--sankey-link)";

export function linkStroke(targetNode: ChartNode): string {
  return (targetNode as any).stroke ?? DEFAULT_STROKE;
}

export function nodeFill(node: ChartNode): string {
  return (node as any).fill ?? DEFAULT_FILL;
}
