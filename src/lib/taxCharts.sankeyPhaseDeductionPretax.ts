import type { TaxResult } from "~/lib/taxCalc";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { addNode } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export function appendSankeyDeductionAndPretax(result: TaxResult, s: SankeyScratch): void {
  if (result.deductionAmount > 0) {
    addNode(s.nodeMap, {
      id: "deduction-shield",
      label: "Shielded income",
      kind: "deductionShield",
      amount: result.deductionAmount + s.preTaxTotal,
      incomeAmount: result.deductionAmount + s.preTaxTotal,
    });

    if (result.deductionKind === "itemized") {
      addNode(s.nodeMap, {
        id: "standard-deduction",
        label: "Standard deduction",
        kind: "standardDeduction",
        amount: result.standardDeduction,
      });
      addNode(s.nodeMap, {
        id: "deduction",
        label: "Itemized deduction",
        kind: "deduction",
        amount: result.deductionAmount,
      });
      s.links.push({
        sourceId: SANKEY_IDS.grossIncome,
        targetId: "standard-deduction",
        value: result.deductionAmount,
      });
      s.links.push({
        sourceId: "standard-deduction",
        targetId: "deduction",
        value: result.deductionAmount,
      });
      s.links.push({ sourceId: "deduction", targetId: "deduction-shield", value: result.deductionAmount });
    } else {
      addNode(s.nodeMap, {
        id: "deduction",
        label: "Standard deduction",
        kind: "deduction",
        amount: result.deductionAmount,
      });
      s.links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: "deduction", value: result.deductionAmount });
      s.links.push({ sourceId: "deduction", targetId: "deduction-shield", value: result.deductionAmount });
    }

    s.takeHomePoolSlices.push({ sourceId: "deduction-shield", weight: result.deductionAmount });
  }

  for (const row of s.pretaxRows) {
    if (row.amount <= 0) continue;
    addNode(s.nodeMap, {
      id: row.middleId,
      label: row.middleLabel,
      kind: "pretaxContribution",
      amount: row.amount,
    });
    addNode(s.nodeMap, {
      id: row.sinkId,
      label: row.sinkLabel,
      kind: "deferredSink",
      amount: row.amount,
    });
    s.links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: row.middleId, value: row.amount });
    if (result.deductionAmount > 0) {
      s.links.push({ sourceId: row.middleId, targetId: "deduction-shield", value: row.amount });
      s.links.push({ sourceId: "deduction-shield", targetId: row.sinkId, value: row.amount });
    } else {
      s.links.push({ sourceId: row.middleId, targetId: row.sinkId, value: row.amount });
    }
  }
}
