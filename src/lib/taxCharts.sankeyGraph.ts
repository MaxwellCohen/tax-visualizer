import type { TaxResult } from "~/lib/taxForm.types";
import type { SankeyChartData } from "~/lib/taxCharts.types";
import { SANKEY_BUILD_PHASES, initSankeyScratch } from "~/lib/config/sankeyBuildPhases.config";

/**
 * Builds Sankey nodes and links from {@link TaxResult}. Prefer {@link TaxResult.display.sankey} when
 * present; otherwise rebuilds from {@link TaxResult.rows} / {@link TaxResult.metricLines}.
 */
export function buildSankeyChartData(result: TaxResult): SankeyChartData {
  if (result.display?.sankey) {
    return result.display.sankey;
  }
  const s = initSankeyScratch(result);
  for (const phase of SANKEY_BUILD_PHASES) {
    phase.append(result, s);
  }
  return {
    nodes: [...s.nodeMap.values()],
    links: s.links,
  };
}
