import type { SankeyGraph } from "d3-sankey";
import type { ChartLink, ChartNode } from "~/components/tax/sankey/types/chartTypes";

export function connectedNodeIds(
  graph: SankeyGraph<ChartNode, ChartLink>,
  nodeId: string,
): Set<string> {
  const ids = new Set<string>([nodeId]);
  for (const link of graph.links) {
    const source = link.source as ChartNode;
    const target = link.target as ChartNode;
    if (source.id === nodeId) ids.add(target.id);
    if (target.id === nodeId) ids.add(source.id);
  }
  return ids;
}

export function isLinkHighlighted(
  link: ChartLink,
  activeNodeId: string | null,
): boolean {
  if (!activeNodeId) return true;
  const source = link.source as ChartNode;
  const target = link.target as ChartNode;
  return source.id === activeNodeId || target.id === activeNodeId;
}
