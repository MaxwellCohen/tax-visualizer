import type { ChartNode } from "~/components/taxSankey/chartTypes";
import { SANKEY_NODE_KIND_CHART_ORDER } from "~/lib/config/sankeyOrder.config";

/**
 * Vertical order for d3-sankey sibling sort: lower number = higher on the chart.
 * Adjust ranks in sankeyOrder.config.ts to reorder flows (same-depth nodes are never compared across depths).
 */
export const SANKEY_SIBLING_RANK: Record<ChartNode["kind"], number> =
  SANKEY_NODE_KIND_CHART_ORDER as Record<ChartNode["kind"], number>;
