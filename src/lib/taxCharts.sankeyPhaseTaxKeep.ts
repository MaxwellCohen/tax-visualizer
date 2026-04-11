import type { TaxResult } from "~/lib/taxCalc";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { addNode, splitTakeHomeAndPayrollByPool } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

type PoolSplit = Map<string, { keep: number; payroll: number }>;

function pushBracketTaxAndKeepLinks(
  s: SankeyScratch,
  split: PoolSplit,
  nodeId: string,
  segment: { taxAmount: number },
  niitPart: number,
): void {
  const part = split.get(nodeId) ?? { keep: 0, payroll: 0 };
  const taxTotal = segment.taxAmount + niitPart + part.payroll;
  if (taxTotal > 0) {
    s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.taxes, value: taxTotal });
  }
  if (part.keep > 0) {
    s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.keep, value: part.keep });
  }
}

function addTaxesAndTakeHomeNodes(result: TaxResult, s: SankeyScratch): void {
  addNode(s.nodeMap, {
    id: SANKEY_IDS.taxes,
    label: "Taxes & payroll",
    kind: "taxes",
    amount: result.federalIncomeTax + result.payrollTax,
  });
  addNode(s.nodeMap, {
    id: SANKEY_IDS.keep,
    label: "Take-home",
    kind: "keep",
    amount: result.takeHomePay,
  });
}

function buildPoolSplit(result: TaxResult, s: SankeyScratch): { split: PoolSplit; poolTotal: number } {
  const poolTotal = s.takeHomePoolSlices.reduce((acc, x) => acc + x.weight, 0);
  const split =
    poolTotal > 0
      ? splitTakeHomeAndPayrollByPool(s.takeHomePoolSlices, result.takeHomePay, result.payrollTax)
      : new Map<string, { keep: number; payroll: number }>();
  return { split, poolTotal };
}

function linkBracketSegmentsToTaxKeep(result: TaxResult, s: SankeyScratch, split: PoolSplit): void {
  for (const segment of result.ordinaryFederalSegments) {
    const nodeId = `ordinary-bracket-${segment.id}`;
    const niitPart = s.niitBySegment.ordinary.get(segment.id) ?? 0;
    pushBracketTaxAndKeepLinks(s, split, nodeId, segment, niitPart);
  }

  for (const segment of result.longTermCapitalGainsSegments) {
    const nodeId = `ltcg-bracket-${segment.id}`;
    const niitPart = s.niitBySegment.ltcg.get(segment.id) ?? 0;
    pushBracketTaxAndKeepLinks(s, split, nodeId, segment, niitPart);
  }
}

function linkDeductionShieldSplit(s: SankeyScratch, split: PoolSplit, deductionAmount: number): void {
  if (deductionAmount <= 0) return;
  const part = split.get("deduction-shield") ?? { keep: 0, payroll: 0 };
  if (part.payroll > 0) {
    s.links.push({ sourceId: "deduction-shield", targetId: SANKEY_IDS.taxes, value: part.payroll });
  }
  if (part.keep > 0) {
    s.links.push({ sourceId: "deduction-shield", targetId: SANKEY_IDS.keep, value: part.keep });
  }
}

function linkGrossIncomeFallback(
  result: TaxResult,
  s: SankeyScratch,
  poolTotal: number,
): void {
  if (poolTotal > 0) return;
  if (result.takeHomePay <= 0 && result.payrollTax <= 0) return;
  if (result.payrollTax > 0) {
    s.links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: SANKEY_IDS.taxes, value: result.payrollTax });
  }
  if (result.takeHomePay > 0) {
    s.links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: SANKEY_IDS.keep, value: result.takeHomePay });
  }
}

export function appendSankeyTaxKeepAndFallback(result: TaxResult, s: SankeyScratch): void {
  addTaxesAndTakeHomeNodes(result, s);
  const { split, poolTotal } = buildPoolSplit(result, s);
  linkBracketSegmentsToTaxKeep(result, s, split);
  linkDeductionShieldSplit(s, split, result.deductionAmount);
  linkGrossIncomeFallback(result, s, poolTotal);
}
