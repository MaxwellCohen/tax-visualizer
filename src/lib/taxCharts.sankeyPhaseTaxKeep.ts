import type { TaxChartMetrics } from "~/lib/taxForm.types";
import { getLongTermCapitalGainsSegments, getOrdinaryFederalSegments } from "~/lib/config/chartMetricsRegistry";
import type { TaxResult } from "~/lib/taxForm.types";
import { incomeRowsFromTaxResult } from "~/lib/taxForm.rows";
import {
  allocateProportional,
  allIncomeNodeEntries,
  payrollSourceEntries,
} from "~/lib/taxCharts.sankeyAllocate";
import { SANKEY_PRIMARY_TERMINALS } from "~/lib/config/sankeyTerminals.config";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { addNode, splitTakeHomeAndPayrollByPool } from "~/lib/taxCharts.sankeyHelpers";
import {
  appendLinksFromTerminalOutflows,
  normalizeTerminalOutflowsToInflow,
  type TerminalOutflow,
} from "~/lib/taxCharts.sankeySliceModel";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";
import {
  allocateFederalCreditsTopMarginalSlices,
  takeHomeAttributableToBracketFlows,
} from "~/lib/taxCharts.visualizationBundle";
import { ltcgBracketNodeId, ordinaryBracketNodeId } from "~/lib/taxCharts.sankeySegmentKeys";

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

/**
 * @param flowScale When {@link SankeyScratch.payrollTaxViaOrdinaryStrip} is set, ordinary-bracket
 * inflows are scaled by {@link SankeyScratch.ordinaryBracketLinkScale}; scale outflows by the same
 * factor so each bracket node conserves flow (in = federal + credits + payroll + take-home).
 * @param bracketInflow Total width into this bracket node (must match link from taxable column).
 */
function pushBracketTaxAndKeepLinks(
  s: SankeyScratch,
  split: PoolSplit,
  nodeId: string,
  federalToTax: number,
  creditPortion: number,
  flowScale: number,
  bracketInflow: number,
): void {
  const part = split.get(nodeId) ?? { keep: 0, payroll: 0 };
  const raw: TerminalOutflow[] = [
    { terminalId: SANKEY_IDS.taxesFederal, amount: federalToTax * flowScale },
    { terminalId: SANKEY_IDS.taxesPayroll, amount: part.payroll * flowScale },
    { terminalId: SANKEY_IDS.federalCredits, amount: creditPortion * flowScale },
    { terminalId: SANKEY_IDS.keep, amount: part.keep * flowScale },
  ];
  const outs = normalizeTerminalOutflowsToInflow(bracketInflow, raw);
  appendLinksFromTerminalOutflows(s.links, nodeId, outs);
}

function addTaxesTakeHomeAndCreditsNodes(m: TaxChartMetrics, s: SankeyScratch): void {
  const hasSE = (m.selfEmploymentTax ?? 0) > 0;
  for (const t of SANKEY_PRIMARY_TERMINALS) {
    if (t.id === SANKEY_IDS.federalCredits && m.federalTaxCreditsApplied <= 0) continue;
    const amount =
      t.id === SANKEY_IDS.taxesFederal
        ? m.federalIncomeTax
        : t.id === SANKEY_IDS.taxesPayroll
          ? m.payrollTax + (hasSE ? m.selfEmploymentTax : 0)
          : t.id === SANKEY_IDS.federalCredits
            ? m.federalTaxCreditsApplied
            : m.takeHomePay;
    addNode(s.nodeMap, {
      id: t.id,
      label: t.label,
      kind: t.kind,
      amount,
    });
  }
  if (hasSE) {
    addNode(s.nodeMap, {
      id: "self-employment-tax",
      label: "Self-employment tax",
      kind: "taxesPayroll",
      amount: m.selfEmploymentTax,
    });
  }
}

function buildPoolSplit(
  m: TaxChartMetrics,
  s: SankeyScratch,
): { split: PoolSplit; poolTotal: number; payrollRemainder: number } {
  const poolTotal = s.takeHomePoolSlices.reduce((acc, x) => acc + x.weight, 0);
  const takeHomeForPools = takeHomeAttributableToBracketFlows(m);
  const payrollForPoolSplit = s.payrollTaxViaOrdinaryStrip ? 0 : m.payrollTax;
  const split =
    poolTotal > 0
      ? splitTakeHomeAndPayrollByPool(s.takeHomePoolSlices, takeHomeForPools, payrollForPoolSplit)
      : new Map<string, { keep: number; payroll: number }>();
  let assignedPayroll = 0;
  for (const v of split.values()) {
    assignedPayroll += v.payroll;
  }
  let payrollRemainder = Math.max(0, m.payrollTax - assignedPayroll);
  if (s.payrollTaxViaOrdinaryStrip) {
    payrollRemainder = Math.max(0, m.payrollTax - s.payrollStripFlowValue);
  }
  return { split, poolTotal, payrollRemainder };
}

function linkBracketSegmentsToTaxKeep(m: TaxChartMetrics, s: SankeyScratch, split: PoolSplit): void {
  const federalByNode = allocateFederalCreditsTopMarginalSlices(m);
  const ordScale = s.ordinaryBracketLinkScale;
  for (const segment of getOrdinaryFederalSegments(m)) {
    const nodeId = ordinaryBracketNodeId(segment);
    const splitFed = federalByNode.get(nodeId) ?? { federalToTax: 0, creditPortion: 0 };
    const bracketInflow = segment.incomeAmount * ordScale;
    pushBracketTaxAndKeepLinks(s, split, nodeId, splitFed.federalToTax, splitFed.creditPortion, ordScale, bracketInflow);
  }

  for (const segment of getLongTermCapitalGainsSegments(m)) {
    const nodeId = ltcgBracketNodeId(segment);
    const splitFed = federalByNode.get(nodeId) ?? { federalToTax: 0, creditPortion: 0 };
    const bracketInflow = segment.incomeAmount;
    pushBracketTaxAndKeepLinks(s, split, nodeId, splitFed.federalToTax, splitFed.creditPortion, 1, bracketInflow);
  }
}

function linkFederalCreditsToKeep(m: TaxChartMetrics, s: SankeyScratch): void {
  if (m.federalTaxCreditsApplied <= 0) return;
  const inn = s.links
    .filter((l) => l.targetId === SANKEY_IDS.federalCredits)
    .reduce((a, l) => a + l.value, 0);
  if (inn <= 0) return;
  s.links.push({
    sourceId: SANKEY_IDS.federalCredits,
    targetId: SANKEY_IDS.keep,
    value: inn,
  });
}

function linkIncomeSourceFallback(
  m: TaxChartMetrics,
  result: TaxResult,
  s: SankeyScratch,
  poolTotal: number,
): void {
  if (poolTotal > 0) return;
  const hasSE = (m.selfEmploymentTax ?? 0) > 0;
  if (m.takeHomePay <= 0 && m.payrollTax <= 0 && (!hasSE || m.selfEmploymentTax <= 0)) return;

  routePayrollTaxFallback(m, result, s, hasSE);
  routeTakeHomeFallback(m, result, s);
  routeCreditsFallback(m, result, s);
}

function routePayrollTaxFallback(m: TaxChartMetrics, result: TaxResult, s: SankeyScratch, hasSE: boolean): void {
  const payrollKeys = payrollSourceEntries(result);
  if (payrollKeys.length === 0) return;

  const totalPayrollTax = m.payrollTax + (hasSE ? m.selfEmploymentTax : 0);
  const payrollForFallback = s.payrollTaxViaOrdinaryStrip
    ? Math.max(0, totalPayrollTax - s.payrollStripFlowValue)
    : totalPayrollTax;

  if (payrollForFallback <= 0) return;

  if (hasSE && m.selfEmploymentTax > 0) {
    routeSelfEmploymentTax(m, result, s, payrollKeys);
  } else {
    pushProportionalInflows(s, payrollKeys, payrollForFallback, SANKEY_IDS.taxesPayroll);
  }
}

function routeSelfEmploymentTax(
  m: TaxChartMetrics,
  result: TaxResult,
  s: SankeyScratch,
  payrollKeys: { key: string; weight: number }[],
): void {
  const seKeys = incomeRowsFromTaxResult(result)
    .filter((src) => src.kind === "selfEmployment" && src.amount > 0)
    .map((src) => ({ key: `income-${src.id}`, weight: src.amount }));

  if (seKeys.length > 0) {
    pushProportionalInflows(s, seKeys, m.selfEmploymentTax, "self-employment-tax");
  }

  const regularPayrollKeys = payrollKeys.filter((k) =>
    incomeRowsFromTaxResult(result).some((src) => `income-${src.id}` === k.key && src.kind === "wages"),
  );
  if (regularPayrollKeys.length > 0 && m.payrollTax > 0) {
    pushProportionalInflows(s, regularPayrollKeys, m.payrollTax, SANKEY_IDS.taxesPayroll);
  }
}

function routeTakeHomeFallback(m: TaxChartMetrics, result: TaxResult, s: SankeyScratch): void {
  const allKeys = allIncomeNodeEntries(result);
  const takeHomeExCredits = takeHomeAttributableToBracketFlows(m);
  if (takeHomeExCredits > 0 && allKeys.length > 0) {
    pushProportionalInflows(s, allKeys, takeHomeExCredits, SANKEY_IDS.keep);
  }
}

function routeCreditsFallback(m: TaxChartMetrics, result: TaxResult, s: SankeyScratch): void {
  const allKeys = allIncomeNodeEntries(result);
  if (m.federalTaxCreditsApplied > 0 && allKeys.length > 0) {
    pushProportionalInflows(s, allKeys, m.federalTaxCreditsApplied, SANKEY_IDS.federalCredits);
    s.links.push({
      sourceId: SANKEY_IDS.federalCredits,
      targetId: SANKEY_IDS.keep,
      value: m.federalTaxCreditsApplied,
    });
  }
}

export function appendSankeyTaxKeepAndFallback(m: TaxChartMetrics, result: TaxResult, s: SankeyScratch): void {
  addTaxesTakeHomeAndCreditsNodes(m, s);
  // Direct flow: ordinary taxable -> payroll taxes (FICA)
  if (m.payrollTax > 0 && m.ordinaryTaxableIncome > 0) {
    const hasOrdinary = getOrdinaryFederalSegments(m).length > 0;
    if (!hasOrdinary || !s.payrollTaxViaOrdinaryStrip) {
      s.links.push({
        sourceId: SANKEY_IDS.ordinaryTaxableIncome,
        targetId: SANKEY_IDS.taxesPayroll,
        value: m.payrollTax,
      });
    }
  }
  if (s.payrollTaxViaOrdinaryStrip && s.payrollStripFlowValue > 0) {
    s.links.push({
      sourceId: SANKEY_IDS.payrollOrdinaryStrip,
      targetId: SANKEY_IDS.taxesPayroll,
      value: s.payrollStripFlowValue,
    });
  }
  const { split, poolTotal, payrollRemainder } = buildPoolSplit(m, s);
  linkBracketSegmentsToTaxKeep(m, s, split);
  /** When `poolTotal === 0`, fallback flows split from income source nodes instead. */
  if (poolTotal > 0) {
    linkFederalCreditsToKeep(m, s);
  }
  if (payrollRemainder > 0) {
    const keys = payrollSourceEntries(result);
    if (keys.length > 0) {
      pushProportionalInflows(s, keys, payrollRemainder, SANKEY_IDS.taxesPayroll);
    }
  }
  linkIncomeSourceFallback(m, result, s, poolTotal);
}
