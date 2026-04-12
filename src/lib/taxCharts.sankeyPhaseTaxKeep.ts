import type { TaxResult } from "~/lib/taxCalc";
import {
  allocateProportional,
  allIncomeNodeEntries,
  payrollSourceEntries,
} from "~/lib/taxCharts.sankeyAllocate";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { addNode, splitTakeHomeAndPayrollByPool } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";
import {
  allocateFederalCreditsTopMarginalSlices,
  takeHomeAttributableToBracketFlows,
} from "~/lib/taxCharts.visualizationBundle";

type PoolSplit = Map<string, { keep: number; payroll: number }>;

function pushProportionalInflows(
  s: SankeyScratch,
  keys: { key: string; weight: number }[],
  total: number,
  targetId: string,
): void {
  for (const { key, value } of allocateProportional(keys, total)) {
    if (value > 0) {
      s.links.push({ sourceId: key, targetId, value });
    }
  }
}

function pushBracketTaxAndKeepLinks(
  s: SankeyScratch,
  split: PoolSplit,
  nodeId: string,
  federalToTax: number,
  creditPortion: number,
): void {
  const part = split.get(nodeId) ?? { keep: 0, payroll: 0 };
  if (federalToTax > 0) {
    s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.taxesFederal, value: federalToTax });
  }
  if (part.payroll > 0) {
    s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.taxesPayroll, value: part.payroll });
  }
  if (creditPortion > 0) {
    s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.federalCredits, value: creditPortion });
  }
  if (part.keep > 0) {
    s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.keep, value: part.keep });
  }
}

function addTaxesTakeHomeAndCreditsNodes(result: TaxResult, s: SankeyScratch): void {
  const hasSE = (result.selfEmploymentTax ?? 0) > 0;
  addNode(s.nodeMap, {
    id: SANKEY_IDS.taxesFederal,
    label: "Federal tax",
    kind: "taxesFederal",
    amount: result.federalIncomeTax,
  });
  addNode(s.nodeMap, {
    id: SANKEY_IDS.taxesPayroll,
    label: "Payroll tax",
    kind: "taxesPayroll",
    amount: result.payrollTax + (hasSE ? result.selfEmploymentTax : 0),
  });
  if (hasSE) {
    addNode(s.nodeMap, {
      id: "self-employment-tax",
      label: "Self-employment tax",
      kind: "taxesPayroll",
      amount: result.selfEmploymentTax,
    });
  }
  if (result.federalTaxCreditsApplied > 0) {
    addNode(s.nodeMap, {
      id: SANKEY_IDS.federalCredits,
      label: "Federal credits",
      kind: "federalCredits",
      amount: result.federalTaxCreditsApplied,
    });
  }
  addNode(s.nodeMap, {
    id: SANKEY_IDS.keep,
    label: "Take-home",
    kind: "keep",
    amount: result.takeHomePay,
  });
}

function buildPoolSplit(
  result: TaxResult,
  s: SankeyScratch,
): { split: PoolSplit; poolTotal: number; payrollRemainder: number } {
  const poolTotal = s.takeHomePoolSlices.reduce((acc, x) => acc + x.weight, 0);
  const takeHomeForPools = takeHomeAttributableToBracketFlows(result);
  const payrollForPoolSplit = s.payrollTaxViaOrdinaryStrip ? 0 : result.payrollTax;
  const split =
    poolTotal > 0
      ? splitTakeHomeAndPayrollByPool(s.takeHomePoolSlices, takeHomeForPools, payrollForPoolSplit)
      : new Map<string, { keep: number; payroll: number }>();
  let assignedPayroll = 0;
  for (const v of split.values()) {
    assignedPayroll += v.payroll;
  }
  let payrollRemainder = Math.max(0, result.payrollTax - assignedPayroll);
  if (s.payrollTaxViaOrdinaryStrip) {
    payrollRemainder = Math.max(0, result.payrollTax - s.payrollStripFlowValue);
  }
  return { split, poolTotal, payrollRemainder };
}

function linkBracketSegmentsToTaxKeep(result: TaxResult, s: SankeyScratch, split: PoolSplit): void {
  const federalByNode = allocateFederalCreditsTopMarginalSlices(result);
  for (const segment of result.ordinaryFederalSegments) {
    const nodeId = `ordinary-bracket-${segment.id}`;
    const splitFed = federalByNode.get(nodeId) ?? { federalToTax: 0, creditPortion: 0 };
    pushBracketTaxAndKeepLinks(s, split, nodeId, splitFed.federalToTax, splitFed.creditPortion);
  }

  for (const segment of result.longTermCapitalGainsSegments) {
    const nodeId = `ltcg-bracket-${segment.id}`;
    const splitFed = federalByNode.get(nodeId) ?? { federalToTax: 0, creditPortion: 0 };
    pushBracketTaxAndKeepLinks(s, split, nodeId, splitFed.federalToTax, splitFed.creditPortion);
  }
}

function linkFederalCreditsToKeep(result: TaxResult, s: SankeyScratch): void {
  if (result.federalTaxCreditsApplied <= 0) return;
  s.links.push({
    sourceId: SANKEY_IDS.federalCredits,
    targetId: SANKEY_IDS.keep,
    value: result.federalTaxCreditsApplied,
  });
}

function linkIncomeSourceFallback(
  result: TaxResult,
  s: SankeyScratch,
  poolTotal: number,
): void {
  if (poolTotal > 0) return;
  const hasSE = (result.selfEmploymentTax ?? 0) > 0;
  if (result.takeHomePay <= 0 && result.payrollTax <= 0 && (!hasSE || result.selfEmploymentTax <= 0)) return;

  routePayrollTaxFallback(result, s, hasSE);
  routeTakeHomeFallback(result, s);
  routeCreditsFallback(result, s);
}

function routePayrollTaxFallback(result: TaxResult, s: SankeyScratch, hasSE: boolean): void {
  const payrollKeys = payrollSourceEntries(result);
  if (payrollKeys.length === 0) return;

  const totalPayrollTax = result.payrollTax + (hasSE ? result.selfEmploymentTax : 0);
  const payrollForFallback = s.payrollTaxViaOrdinaryStrip
    ? Math.max(0, totalPayrollTax - s.payrollStripFlowValue)
    : totalPayrollTax;

  if (payrollForFallback <= 0) return;

  if (hasSE && result.selfEmploymentTax > 0) {
    routeSelfEmploymentTax(result, s, payrollKeys);
  } else {
    pushProportionalInflows(s, payrollKeys, payrollForFallback, SANKEY_IDS.taxesPayroll);
  }
}

function routeSelfEmploymentTax(result: TaxResult, s: SankeyScratch, payrollKeys: { key: string; weight: number }[]): void {
  const seKeys = result.incomeSources
    .filter(src => src.kind === "selfEmployment" && src.amount > 0)
    .map(src => ({ key: `income-${src.id}`, weight: src.amount }));

  if (seKeys.length > 0) {
    pushProportionalInflows(s, seKeys, result.selfEmploymentTax, "self-employment-tax");
  }

  const regularPayrollKeys = payrollKeys.filter(k =>
    result.incomeSources.some(src => `income-${src.id}` === k.key && src.kind === "wages")
  );
  if (regularPayrollKeys.length > 0 && result.payrollTax > 0) {
    pushProportionalInflows(s, regularPayrollKeys, result.payrollTax, SANKEY_IDS.taxesPayroll);
  }
}

function routeTakeHomeFallback(result: TaxResult, s: SankeyScratch): void {
  const allKeys = allIncomeNodeEntries(result);
  const takeHomeExCredits = takeHomeAttributableToBracketFlows(result);
  if (takeHomeExCredits > 0 && allKeys.length > 0) {
    pushProportionalInflows(s, allKeys, takeHomeExCredits, SANKEY_IDS.keep);
  }
}

function routeCreditsFallback(result: TaxResult, s: SankeyScratch): void {
  const allKeys = allIncomeNodeEntries(result);
  if (result.federalTaxCreditsApplied > 0 && allKeys.length > 0) {
    pushProportionalInflows(s, allKeys, result.federalTaxCreditsApplied, SANKEY_IDS.federalCredits);
    s.links.push({
      sourceId: SANKEY_IDS.federalCredits,
      targetId: SANKEY_IDS.keep,
      value: result.federalTaxCreditsApplied,
    });
  }
}

export function appendSankeyTaxKeepAndFallback(result: TaxResult, s: SankeyScratch): void {
  addTaxesTakeHomeAndCreditsNodes(result, s);
  if (s.payrollTaxViaOrdinaryStrip && s.payrollStripFlowValue > 0) {
    s.links.push({
      sourceId: SANKEY_IDS.payrollOrdinaryStrip,
      targetId: SANKEY_IDS.taxesPayroll,
      value: s.payrollStripFlowValue,
    });
  }
  const { split, poolTotal, payrollRemainder } = buildPoolSplit(result, s);
  linkBracketSegmentsToTaxKeep(result, s, split);
  /** When `poolTotal === 0`, fallback flows split from income source nodes instead. */
  if (poolTotal > 0) {
    linkFederalCreditsToKeep(result, s);
  }
  if (payrollRemainder > 0) {
    const keys = payrollSourceEntries(result);
    if (keys.length > 0) {
      pushProportionalInflows(s, keys, payrollRemainder, SANKEY_IDS.taxesPayroll);
    }
  }
  linkIncomeSourceFallback(result, s, poolTotal);
}
