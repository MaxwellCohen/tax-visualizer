import { incomeSourceDisplayLabel } from "~/lib/taxCalc";
import type { TaxFormIncomeRow } from "~/lib/taxForm.types";
import { INCOME_KIND_CHART_ORDER_BY_KIND } from "~/lib/config/chartMetricsRegistry";
import type { SankeyChartNode } from "~/lib/taxCharts.types";

export function addNode(nodeMap: Map<string, SankeyChartNode>, node: SankeyChartNode): void {
  if (!nodeMap.has(node.id)) {
    nodeMap.set(node.id, node);
  }
}

export function sortedIncomeRows(incomeRows: TaxFormIncomeRow[]) {
  return [...incomeRows].sort((a, b) => {
    const kindDiff = INCOME_KIND_CHART_ORDER_BY_KIND[a.kind] - INCOME_KIND_CHART_ORDER_BY_KIND[b.kind];
    if (kindDiff !== 0) return kindDiff;
    return incomeSourceDisplayLabel(a).localeCompare(incomeSourceDisplayLabel(b));
  });
}

/**
 * Split take-home across all pool slices by weight.
 * Payroll tax (FICA) is split only across **ordinary** bracket slices — same idea as long-term
 * gains not bearing payroll: capital-gain paths get federal preferential tax ribbons but no payroll
 * ribbons. `deduction-shield` is also excluded. When no ordinary bracket slice exists, payroll stays
 * unassigned here; callers add split `income-* → taxes-payroll` remainder links.
 */
export function splitTakeHomeAndPayrollByPool(
  slices: { sourceId: string; weight: number }[],
  takeHomePay: number,
  payrollTax: number,
): Map<string, { keep: number; payroll: number }> {
  const out = new Map<string, { keep: number; payroll: number }>();
  const pool = slices.reduce((s, x) => s + x.weight, 0);
  if (pool <= 0 || slices.length === 0) return out;

  const payrollSlices = slices.filter(x => x.sourceId.startsWith("ordinary-bracket-"));
  const payrollPool = payrollSlices.reduce((s, x) => s + x.weight, 0);

  let accKeep = 0;
  slices.forEach((slice, i) => {
    const last = i === slices.length - 1;
    const keep = last ? Math.max(0, takeHomePay - accKeep) : Math.round((slice.weight / pool) * takeHomePay);
    accKeep += keep;
    out.set(slice.sourceId, { keep, payroll: 0 });
  });

  if (payrollTax <= 0 || payrollPool <= 0) {
    return out;
  }

  let accPayroll = 0;
  payrollSlices.forEach((slice, i) => {
    const last = i === payrollSlices.length - 1;
    const payroll = last
      ? Math.max(0, payrollTax - accPayroll)
      : Math.round((slice.weight / payrollPool) * payrollTax);
    accPayroll += payroll;
    const prev = out.get(slice.sourceId)!;
    out.set(slice.sourceId, { keep: prev.keep, payroll });
  });

  return out;
}
