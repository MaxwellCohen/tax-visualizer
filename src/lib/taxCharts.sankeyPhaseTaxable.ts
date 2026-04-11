import type { TaxResult } from "~/lib/taxCalc";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { addNode } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export function appendSankeyTaxableIncomeNodes(result: TaxResult, s: SankeyScratch): void {
  if (result.longTermTaxableIncome > 0) {
    addNode(s.nodeMap, {
      id: SANKEY_IDS.longTermTaxableIncome,
      label: "Long-term taxable",
      kind: "longTermTaxableIncome",
      amount: result.longTermTaxableIncome,
    });
    s.links.push({
      sourceId: SANKEY_IDS.grossIncome,
      targetId: SANKEY_IDS.longTermTaxableIncome,
      value: result.longTermTaxableIncome,
    });
  }

  if (result.ordinaryTaxableIncome > 0) {
    const ordinaryTaxableLabel =
      result.shortTermCapGainsGrossIncome > 0
        ? "Ordinary taxable (incl. short-term gains)"
        : "Ordinary taxable";
    addNode(s.nodeMap, {
      id: SANKEY_IDS.ordinaryTaxableIncome,
      label: ordinaryTaxableLabel,
      kind: "ordinaryTaxableIncome",
      amount: result.ordinaryTaxableIncome,
    });
    s.links.push({
      sourceId: SANKEY_IDS.grossIncome,
      targetId: SANKEY_IDS.ordinaryTaxableIncome,
      value: result.ordinaryTaxableIncome,
    });
  }
}
