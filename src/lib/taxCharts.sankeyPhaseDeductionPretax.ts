import type { TaxResult } from "~/lib/taxForm.types";
import { chartMetricNumeric, deductionKindFromTaxResult } from "~/lib/taxChartMetricRead";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import {
  allocateProportional,
  allIncomeNodeEntries,
  ordinaryIncomeNodeEntries,
  wageIncomeNodeEntries,
} from "~/lib/taxCharts.sankeyAllocate";
import { addNode } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";
import {
  deductionShieldAccountingOutflow,
  effectiveDeductionToLtcgGrossShield,
  effectiveDeductionToOrdinary,
  effectiveDeductionShelteredTotal,
} from "~/lib/taxCharts.visualizationBundle";

function deductionIncomeShelteredTotal(result: TaxResult): number {
  return effectiveDeductionShelteredTotal(result);
}

/** Routes the modeled deduction inflow: ordinary rows first; LTCG remainder flows from `ltcgDeductionShield` (not LTCG income rows). */
function pushDeductionInflowLinks(result: TaxResult, s: SankeyScratch, targetId: string): void {
  const toOrdinary = effectiveDeductionToOrdinary(result);
  const fromLtcgShield = effectiveDeductionToLtcgGrossShield(result);
  if (toOrdinary > 0) {
    const ord = ordinaryIncomeNodeEntries(result);
    const fromWage = wageIncomeNodeEntries(result);
    const keys = ord.length > 0 ? ord : fromWage.length > 0 ? fromWage : [];
    if (keys.length > 0) {
      for (const { key, value } of allocateProportional(keys, toOrdinary)) {
        s.links.push({ sourceId: key, targetId, value });
      }
    }
  }
  if (fromLtcgShield > 0) {
    s.links.push({
      sourceId: SANKEY_IDS.ltcgDeductionShield,
      targetId,
      value: fromLtcgShield,
    });
  }
}

export function appendSankeyDeductionAndPretax(result: TaxResult, s: SankeyScratch): void {
  if (chartMetricNumeric(result, "deductionAmount") > 0) {
    addDeductionNodes(result, s);
  }
  addPretaxRows(result, s);
}

function addDeductionNodes(result: TaxResult, s: SankeyScratch): void {
  const deductionSheltered = deductionIncomeShelteredTotal(result);
  const totalAmount = deductionSheltered + s.preTaxTotal;

  addNode(s.nodeMap, {
    id: "deduction-shield",
    label: "Shielded income",
    kind: "deductionShield",
    amount: totalAmount,
    incomeAmount: totalAmount,
  });

  if (deductionKindFromTaxResult(result) === "itemized") {
    addItemizedDeductionNodes(result, s, deductionSheltered);
  } else {
    addStandardDeductionNode(result, s, deductionSheltered);
  }

  addDeductionOutflow(result, s);
}

function addItemizedDeductionNodes(result: TaxResult, s: SankeyScratch, deductionSheltered: number): void {
  addNode(s.nodeMap, {
    id: "deduction",
    label: "Itemized deduction",
    kind: "deduction",
    amount: deductionSheltered,
  });
  pushDeductionInflowLinks(result, s, "deduction");
  s.links.push({ sourceId: "deduction", targetId: "deduction-shield", value: deductionSheltered });
}

function addStandardDeductionNode(result: TaxResult, s: SankeyScratch, deductionSheltered: number): void {
  addNode(s.nodeMap, {
    id: "standard-deduction",
    label: "Standard deduction",
    kind: "standardDeduction",
    amount: deductionSheltered,
  });
  pushDeductionInflowLinks(result, s, "standard-deduction");
  s.links.push({ sourceId: "standard-deduction", targetId: "deduction-shield", value: deductionSheltered });
}

function addDeductionOutflow(result: TaxResult, s: SankeyScratch): void {
  const shieldOut = deductionShieldAccountingOutflow(result);
  addNode(s.nodeMap, {
    id: SANKEY_IDS.keep,
    label: "Take-home",
    kind: "keep",
    amount: chartMetricNumeric(result, "takeHomePay"),
  });
  s.links.push({
    sourceId: "deduction-shield",
    targetId: SANKEY_IDS.keep,
    value: shieldOut,
  });
}

function addPretaxRows(result: TaxResult, s: SankeyScratch): void {
  for (const row of s.pretaxRows) {
    if (row.amount <= 0) continue;
    addPretaxRowNodes(result, s, row);
  }
}

function addPretaxRowNodes(
  result: TaxResult,
  s: SankeyScratch,
  row: { middleId: string; middleLabel: string; sinkId: string; sinkLabel: string; amount: number },
): void {
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

  const pretaxFrom = wageIncomeNodeEntries(result);
  const keys = pretaxFrom.length > 0 ? pretaxFrom : allIncomeNodeEntries(result);
  for (const { key, value } of allocateProportional(keys, row.amount)) {
    s.links.push({ sourceId: key, targetId: row.middleId, value });
  }

  if (chartMetricNumeric(result, "deductionAmount") > 0) {
    s.links.push({ sourceId: row.middleId, targetId: "deduction-shield", value: row.amount });
    s.links.push({ sourceId: "deduction-shield", targetId: row.sinkId, value: row.amount });
  } else {
    s.links.push({ sourceId: row.middleId, targetId: row.sinkId, value: row.amount });
  }
}
