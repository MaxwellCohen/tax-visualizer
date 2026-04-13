import type { TaxResult, TaxResultDisplay } from "~/lib/taxForm.types";
import { buildMekkoRows } from "~/lib/taxCharts.buildMekko";
import { allocateFederalCreditsTopMarginalSlices } from "~/lib/taxCharts.visualizationBundle";
import { buildSankeyChartData } from "~/lib/taxCharts.sankeyBuilder";

/**
 * Builds Sankey graph + Mekko rows once from pipeline metrics. Federal credit split is shared between both.
 */
export function buildTaxResultDisplayBundle(result: TaxResult): TaxResultDisplay {
  const federalCreditsByBracket = allocateFederalCreditsTopMarginalSlices(result);
  const mekkoRows = buildMekkoRows(result, federalCreditsByBracket);
  const sankey = buildSankeyChartData(result);
  return {
    sankey,
    mekko: { rows: mekkoRows },
  };
}
