import type { ChartNode } from "~/components/taxSankey/chartTypes";
import { SANKEY_SIBLING_RANK } from "~/components/taxSankey/sankeySiblingRank.constants";
import { INCOME_KIND_CHART_ORDER } from "~/lib/taxCharts";

export function compareSankeySiblings(a: ChartNode, b: ChartNode): number {
  if (a.kind === "ordinaryTaxableIncome" && b.kind === "longTermTaxableIncome") return 1;
  if (a.kind === "longTermTaxableIncome" && b.kind === "ordinaryTaxableIncome") return -1;

  if (a.kind === "incomeSource" && b.kind === "incomeSource") {
    const ka = a.incomeKind;
    const kb = b.incomeKind;
    if (ka && kb) {
      const kindDiff = INCOME_KIND_CHART_ORDER[ka] - INCOME_KIND_CHART_ORDER[kb];
      if (kindDiff !== 0) return kindDiff;
    }
    return a.label.localeCompare(b.label);
  }

  if (a.kind === "ordinaryBracket" && b.kind === "ordinaryBracket") {
    const rateDiff = (b.marginalRate ?? 0) - (a.marginalRate ?? 0);
    if (rateDiff !== 0) return rateDiff;
    const startDiff = (b.rangeStart ?? 0) - (a.rangeStart ?? 0);
    if (startDiff !== 0) return startDiff;
    return a.label.localeCompare(b.label);
  }

  if (a.kind === "ltcgBracket" && b.kind === "ltcgBracket") {
    const rateDiff = (b.marginalRate ?? 0) - (a.marginalRate ?? 0);
    if (rateDiff !== 0) return rateDiff;
    return a.label.localeCompare(b.label);
  }

  if (a.kind === "deferredSink" && b.kind === "deferredSink") {
    return a.label.localeCompare(b.label);
  }

  return SANKEY_SIBLING_RANK[a.kind] - SANKEY_SIBLING_RANK[b.kind];
}
