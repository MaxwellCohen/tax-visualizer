import type { ChartNode } from "~/components/taxSankey/chartTypes";
import { SANKEY_SIBLING_RANK } from "~/components/taxSankey/sankeySiblingRank.constants";

const INCOME_KIND_ORDER_MAP: Record<string, number> = {};

const PRETAX_MIDDLE_VERTICAL_RANK: Record<string, number> = {
  "pretax-hsa": 0,
  "pretax-other": 1,
  "pretax-ira": 2,
  "pretax-401k": 3,
};

const DEFERRED_SINK_VERTICAL_RANK: Record<string, number> = {
  "deferred-hsa": 0,
  "deferred-other": 1,
  "deferred-ira": 2,
  "deferred-401k": 3,
};

function comparePretaxContributionSiblings(a: ChartNode, b: ChartNode): number | null {
  if (a.kind !== "pretaxContribution" || b.kind !== "pretaxContribution") return null;
  const ra = PRETAX_MIDDLE_VERTICAL_RANK[a.id];
  const rb = PRETAX_MIDDLE_VERTICAL_RANK[b.id];
  if (ra !== undefined && rb !== undefined) return ra - rb;
  return a.label.localeCompare(b.label);
}

function compareOrdinaryVsLongTermTaxable(a: ChartNode, b: ChartNode): number | null {
  if (a.kind === "ordinaryTaxableIncome" && b.kind === "longTermTaxableIncome") return 1;
  if (a.kind === "longTermTaxableIncome" && b.kind === "ordinaryTaxableIncome") return -1;
  return null;
}

function compareIncomeSourceSiblings(a: ChartNode, b: ChartNode): number | null {
  if (a.kind !== "incomeSource" || b.kind !== "incomeSource") return null;
  const ka = a.incomeKind;
  const kb = b.incomeKind;
  if (ka && kb) {
    const kindDiff = (INCOME_KIND_ORDER_MAP[ka] ?? 99) - (INCOME_KIND_ORDER_MAP[kb] ?? 99);
    if (kindDiff !== 0) return kindDiff;
  }
  return a.label.localeCompare(b.label);
}

function compareOrdinaryBracketSiblings(a: ChartNode, b: ChartNode): number | null {
  if (a.kind !== "ordinaryBracket" || b.kind !== "ordinaryBracket") return null;
  const rateDiff = (b.marginalRate ?? 0) - (a.marginalRate ?? 0);
  if (rateDiff !== 0) return rateDiff;
  const startDiff = (b.rangeStart ?? 0) - (a.rangeStart ?? 0);
  if (startDiff !== 0) return startDiff;
  return a.label.localeCompare(b.label);
}

function compareLtcgBracketSiblings(a: ChartNode, b: ChartNode): number | null {
  if (a.kind !== "ltcgBracket" || b.kind !== "ltcgBracket") return null;
  const rateDiff = (b.marginalRate ?? 0) - (a.marginalRate ?? 0);
  if (rateDiff !== 0) return rateDiff;
  return a.label.localeCompare(b.label);
}

function compareDeferredSinkSiblings(a: ChartNode, b: ChartNode): number | null {
  if (a.kind !== "deferredSink" || b.kind !== "deferredSink") return null;
  const ra = DEFERRED_SINK_VERTICAL_RANK[a.id];
  const rb = DEFERRED_SINK_VERTICAL_RANK[b.id];
  if (ra !== undefined && rb !== undefined) return ra - rb;
  return a.label.localeCompare(b.label);
}

function compareDeductionSiblings(a: ChartNode, b: ChartNode): number | null {
  if (a.kind !== "standardDeduction" && a.kind !== "deduction") return null;
  if (b.kind !== "standardDeduction" && b.kind !== "deduction") return null;
  if (a.kind === "deduction" && b.kind === "standardDeduction") return 1;
  if (a.kind === "standardDeduction" && b.kind === "deduction") return -1;
  return null;
}

/**
 * When nodes share a depth, order top → bottom: payroll (FICA) strip first, then long-term gain
 * brackets, then ordinary rate brackets — payroll sits above all marginal-rate band bars.
 */
function compareCapitalGainsPayrollOrdinaryStack(a: ChartNode, b: ChartNode): number | null {
  const tier = (n: ChartNode): number | null => {
    if (n.kind === "payrollOrdinaryStrip") return 0;
    if (n.kind === "ltcgBracket") return 1;
    if (n.kind === "ordinaryBracket") return 2;
    return null;
  };
  const ta = tier(a);
  const tb = tier(b);
  if (ta === null || tb === null) return null;
  if (ta !== tb) return ta - tb;
  return null;
}

export function compareSankeySiblings(a: ChartNode, b: ChartNode): number {
  const taxable = compareOrdinaryVsLongTermTaxable(a, b);
  if (taxable !== null) return taxable;

  const income = compareIncomeSourceSiblings(a, b);
  if (income !== null) return income;

  const stack = compareCapitalGainsPayrollOrdinaryStack(a, b);
  if (stack !== null) return stack;

  const ord = compareOrdinaryBracketSiblings(a, b);
  if (ord !== null) return ord;

  const ltcg = compareLtcgBracketSiblings(a, b);
  if (ltcg !== null) return ltcg;

  const pretaxMid = comparePretaxContributionSiblings(a, b);
  if (pretaxMid !== null) return pretaxMid;

  const def = compareDeferredSinkSiblings(a, b);
  if (def !== null) return def;

  const deduction = compareDeductionSiblings(a, b);
  if (deduction !== null) return deduction;

  return SANKEY_SIBLING_RANK[a.kind] - SANKEY_SIBLING_RANK[b.kind];
}
