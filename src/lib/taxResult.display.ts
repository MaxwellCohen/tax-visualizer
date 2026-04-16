import type { TaxResult, TaxResultDisplay } from "~/lib/taxForm.types";
import { buildMekkoRows } from "~/lib/taxCharts.buildMekko";

/**
 * Builds Sankey graph + Mekko rows once from pipeline metrics. Federal credit split is shared between both.
 */
export function buildTaxResultDisplayBundle(result: TaxResult): TaxResultDisplay {
  const mekkoRows = buildMekkoRows(result);
  return {
    mekko: { rows: mekkoRows },
  };
}
