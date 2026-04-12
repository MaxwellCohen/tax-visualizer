import type { TaxResult } from "~/lib/taxForm.types";
import type { SankeyChartData } from "~/lib/taxCharts.types";

/**
 * Builds Sankey nodes and links from {@link TaxResult}. Metrics are derived from `result.rows` via
 * {@link buildTaxChartMetricsFromRows} (declarative row-id list in sankey tax-result config; zero-valued
 * computed rows are omitted from the index except segment/kind metadata carriers). Flow conservation
 * for tax buckets is enforced when routing bracket slices to terminals (see
 * {@link normalizeTerminalOutflowsToInflow}).
 */
export function buildSankeyChartData(result: TaxResult): SankeyChartData {
const nodes = result.rows.filter(row => row.type === "computed" && row.value > 0)
.map( row => (
  // insert code to make nodes her. use sankey config
))
const links = nodes.map(node => (
  // ad link data here
))
return {
    nodes
    links,
  };
}
