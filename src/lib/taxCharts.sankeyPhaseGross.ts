import { incomeSourceDisplayLabel, type TaxResult } from "~/lib/taxCalc";
import { sankeyIncomeNodeId } from "~/lib/taxCharts.sankeyAllocate";
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
    payrollTaxViaOrdinaryStrip: false,
    ordinaryBracketLinkScale: 1,
    payrollStripFlowValue: 0,
  };
}

/** Left column: one node per income row (flows go straight into taxable buckets and other paths). */
export function appendSankeyIncomeSourceNodes(result: TaxResult, s: SankeyScratch): void {
  for (const source of sortedIncomeSources(result)) {
    if (source.amount <= 0) continue;
    const nodeId = sankeyIncomeNodeId(source.id);
    addNode(s.nodeMap, {
      id: nodeId,
      label: incomeSourceDisplayLabel(source),
      kind: "incomeSource",
      amount: source.amount,
      incomeKind: source.kind,
    });
  }
}
