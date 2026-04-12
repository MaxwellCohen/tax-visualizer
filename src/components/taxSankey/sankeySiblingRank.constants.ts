import type { ChartNode } from "~/components/taxSankey/chartTypes";
import { SANKEY_NODE_KIND_CHART_ORDER } from "~/lib/config/chartMetricsRegistry";

/**
 * Vertical order for d3-sankey sibling sort: lower number = higher on the chart.
 * Adjust ranks via {@link SANKEY_NODE_LAYOUT} in chartMetricsRegistry to reorder flows (same-depth nodes are never compared across depths).
 */
export const SANKEY_SIBLING_RANK: Record<ChartNode["kind"], number> =
  SANKEY_NODE_KIND_CHART_ORDER as Record<ChartNode["kind"], number>;
