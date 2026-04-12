import type { TaxChartMetrics, TaxResult, TaxResultDisplay } from "~/lib/taxForm.types";
import { buildMekkoRows } from "~/lib/taxCharts.buildMekko";
import { allocateFederalCreditsTopMarginalSlices } from "~/lib/taxCharts.visualizationBundle";
import { SANKEY_BUILD_PHASES, initSankeyScratch } from "~/lib/config/sankeyBuildPhases.config";

/**
 * Builds Sankey graph + Mekko rows once from pipeline metrics. Federal credit split is shared between both.
 */
export function buildTaxResultDisplayBundle(m: TaxChartMetrics, result: TaxResult): TaxResultDisplay {
  const federalCreditsByBracket = allocateFederalCreditsTopMarginalSlices(m);
  const mekkoRows = buildMekkoRows(m, federalCreditsByBracket);
  const s = initSankeyScratch(m, result);
  for (const phase of SANKEY_BUILD_PHASES) {
    phase.append(m, result, s);
  }
  return {
    sankey: {
      nodes: [...s.nodeMap.values()],
      links: s.links,
    },
    mekko: { rows: mekkoRows },
  };
}
