import type { TaxResult } from "~/lib/taxCalc";
import type { SankeyChartData } from "~/lib/taxCharts.types";
import { appendSankeyIncomeSourceNodes, initSankeyScratch } from "~/lib/taxCharts.sankeyPhaseGross";
import { appendSankeyTaxableIncomeNodes } from "~/lib/taxCharts.sankeyPhaseTaxable";
import { appendSankeyDeductionAndPretax } from "~/lib/taxCharts.sankeyPhaseDeductionPretax";
import { appendSankeyBracketNodes } from "~/lib/taxCharts.sankeyPhaseBrackets";
import { appendSankeyTaxKeepAndFallback } from "~/lib/taxCharts.sankeyPhaseTaxKeep";

export function buildSankeyChartData(result: TaxResult): SankeyChartData {
  const s = initSankeyScratch(result);
  appendSankeyIncomeSourceNodes(result, s);
  appendSankeyTaxableIncomeNodes(result, s);
  appendSankeyDeductionAndPretax(result, s);
  appendSankeyBracketNodes(result, s);
  appendSankeyTaxKeepAndFallback(result, s);
  return {
    nodes: [...s.nodeMap.values()],
    links: s.links,
  };
}
