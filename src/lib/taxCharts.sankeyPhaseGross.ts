import { incomeSourceDisplayLabel } from "~/lib/taxCalc";
import type { TaxChartMetrics } from "~/lib/taxForm.types";
import type { TaxResult } from "~/lib/taxForm.types";
import { sankeyIncomeNodeId } from "~/lib/taxCharts.sankeyAllocate";
import { addNode, sortedIncomeRows } from "~/lib/taxCharts.sankeyHelpers";
import { sankeyPretaxRowsFromMetrics } from "~/lib/taxCharts.sankeyPretaxRows";
import { netInvestmentIncomeTaxPerSegment } from "~/lib/taxCharts.sankeyNiit";
import { incomeRowsFromTaxResult } from "~/lib/taxForm.rows";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export function initSankeyScratch(m: TaxChartMetrics, result: TaxResult): SankeyScratch {
  const pretaxRows = sankeyPretaxRowsFromMetrics(m);
  const preTaxTotal = pretaxRows.reduce((s, row) => s + Math.max(0, row.amount), 0);
  return {
    nodeMap: new Map(),
    links: [],
    takeHomePoolSlices: [],
    niitBySegment: netInvestmentIncomeTaxPerSegment(m),
    pretaxRows,
    preTaxTotal,
    payrollTaxViaOrdinaryStrip: false,
    ordinaryBracketLinkScale: 1,
    payrollStripFlowValue: 0,
  };
}

/** Left column: one node per income row (flows go straight into taxable buckets and other paths). */
export function appendSankeyIncomeSourceNodes(result: TaxResult, s: SankeyScratch): void {
  for (const source of sortedIncomeRows(incomeRowsFromTaxResult(result))) {
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
