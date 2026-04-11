import { incomeSourceDisplayLabel, type TaxResult } from "~/lib/taxCalc";
import { INCOME_KIND_CHART_ORDER } from "~/lib/taxCharts.sankey.constants";
import type { SankeyChartNode } from "~/lib/taxCharts.types";

export function addNode(nodeMap: Map<string, SankeyChartNode>, node: SankeyChartNode): void {
  if (!nodeMap.has(node.id)) {
    nodeMap.set(node.id, node);
  }
}

export function sortedIncomeSources(result: TaxResult) {
  return [...result.incomeSources].sort((a, b) => {
    const kindDiff = INCOME_KIND_CHART_ORDER[a.kind] - INCOME_KIND_CHART_ORDER[b.kind];
    if (kindDiff !== 0) return kindDiff;
    return incomeSourceDisplayLabel(a).localeCompare(incomeSourceDisplayLabel(b));
  });
}

/** Split take-home and payroll across bracket/shield slices by retained weight (replaces a pass-through "after federal" node). */
export function splitTakeHomeAndPayrollByPool(
  slices: { sourceId: string; weight: number }[],
  takeHomePay: number,
  payrollTax: number,
): Map<string, { keep: number; payroll: number }> {
  const out = new Map<string, { keep: number; payroll: number }>();
  const pool = slices.reduce((s, x) => s + x.weight, 0);
  if (pool <= 0 || slices.length === 0) return out;

  let accKeep = 0;
  let accPayroll = 0;
  slices.forEach((slice, i) => {
    const last = i === slices.length - 1;
    const keep = last ? Math.max(0, takeHomePay - accKeep) : Math.round((slice.weight / pool) * takeHomePay);
    const payroll = last ? Math.max(0, payrollTax - accPayroll) : Math.round((slice.weight / pool) * payrollTax);
    accKeep += keep;
    accPayroll += payroll;
    out.set(slice.sourceId, { keep, payroll });
  });
  return out;
}
