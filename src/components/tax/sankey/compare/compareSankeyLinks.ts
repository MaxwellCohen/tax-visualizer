import type { ChartLink, ChartNode } from "~/components/tax/sankey/types/chartTypes";

export function compareSankeyItemsByRowAndCol(a: ChartLink | ChartNode, b: ChartLink | ChartNode): number {
  if (!a || !b) {
    return 0;
  }
  const aVal = (a?.row || 0) + ((a?.col || 0) * 1000)
  const bVal = (b.row || 0) + ((a?.col || 0) * 1000)
  return aVal - bVal;
}
