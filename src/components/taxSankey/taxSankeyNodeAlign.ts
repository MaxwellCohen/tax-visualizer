import { sankeyJustify } from "d3-sankey";
import type { ChartNode } from "~/components/taxSankey/chartTypes";
import {
  SANKEY_VISUAL_COLUMN_BY_KIND,
  SANKEY_VISUAL_SEMANTIC_MAX,
} from "~/lib/config/chartMetricsRegistry";

function semanticColumnToLayer(semantic: number, n: number): number {
  if (n <= 1) return 0;
  const maxLayer = n - 1;
  const t = SANKEY_VISUAL_SEMANTIC_MAX > 0 ? semantic / SANKEY_VISUAL_SEMANTIC_MAX : 0;
  return Math.max(0, Math.min(maxLayer, Math.round(t * maxLayer)));
}

/**
 * d3-sankey `nodeAlign`: assigns each node to a layer index. Maps `SANKEY_VISUAL_COLUMN_BY_KIND`
 * onto `0..n-1` by **proportion** so semantic columns 3 (brackets) and 4 (taxes / take-home) stay
 * in different layers when the graph only has `n === 4` layers (common for wage-only flows).
 */
export function taxSankeyNodeAlign(node: ChartNode, n: number): number {
  const semantic = SANKEY_VISUAL_COLUMN_BY_KIND[node.kind];
  if (semantic !== undefined) {
    return semanticColumnToLayer(semantic, n);
  }
  return sankeyJustify(node, n);
}
