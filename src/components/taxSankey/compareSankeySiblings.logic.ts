import type { ChartNode } from "~/components/taxSankey/chartTypes";
import { SANKEY_SIBLING_RANK } from "~/components/taxSankey/sankeySiblingRank.constants";
import { INCOME_KIND_CHART_ORDER } from "~/lib/taxCharts";

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
    const kindDiff = INCOME_KIND_CHART_ORDER[ka] - INCOME_KIND_CHART_ORDER[kb];
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
  return a.label.localeCompare(b.label);
}

export function compareSankeySiblings(a: ChartNode, b: ChartNode): number {
  const taxable = compareOrdinaryVsLongTermTaxable(a, b);
  if (taxable !== null) return taxable;

  const income = compareIncomeSourceSiblings(a, b);
  if (income !== null) return income;

  const ord = compareOrdinaryBracketSiblings(a, b);
  if (ord !== null) return ord;

  const ltcg = compareLtcgBracketSiblings(a, b);
  if (ltcg !== null) return ltcg;

  const def = compareDeferredSinkSiblings(a, b);
  if (def !== null) return def;

  return SANKEY_SIBLING_RANK[a.kind] - SANKEY_SIBLING_RANK[b.kind];
}
