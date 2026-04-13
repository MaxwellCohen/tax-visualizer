import type { TaxResult } from "~/lib/taxForm.types";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

/** Passed to each registry `sankey.append` during Sankey construction (see SANKEY_BUILD_PHASES). */
export type SankeyMetricAppendContext = {
  result: TaxResult;
  s: SankeyScratch;
};
