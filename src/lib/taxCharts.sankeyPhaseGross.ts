import { incomeSourceDisplayLabel, type TaxResult } from "~/lib/taxCalc";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { addNode, sortedIncomeSources } from "~/lib/taxCharts.sankeyHelpers";
import { sankeyPretaxRowsFromResult } from "~/lib/taxCharts.sankeyPretaxRows";
import { netInvestmentIncomeTaxPerSegment } from "~/lib/taxCharts.sankeyNiit";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export function initSankeyScratch(result: TaxResult): SankeyScratch {
  const pretaxRows = sankeyPretaxRowsFromResult(result);
  const preTaxTotal = pretaxRows.reduce((s, row) => s + Math.max(0, row.amount), 0);
  return {
    nodeMap: new Map(),
    links: [],
    takeHomePoolSlices: [],
    niitBySegment: netInvestmentIncomeTaxPerSegment(result),
    pretaxRows,
    preTaxTotal,
  };
}

export function appendSankeyGrossAndIncome(result: TaxResult, s: SankeyScratch): void {
  addNode(s.nodeMap, {
    id: SANKEY_IDS.grossIncome,
    label: "Gross income",
    kind: "grossIncome",
    amount: result.totalIncome,
  });

  for (const source of sortedIncomeSources(result)) {
    if (source.amount <= 0) continue;
    const nodeId = `income-${source.id}`;
    addNode(s.nodeMap, {
      id: nodeId,
      label: incomeSourceDisplayLabel(source),
      kind: "incomeSource",
      amount: source.amount,
      incomeKind: source.kind,
    });
    s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.grossIncome, value: source.amount });
  }
}
