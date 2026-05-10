import type { ChartLink } from "~/components/tax/sankey/types/chartTypes";

export function compareSankeyLinks(a: ChartLink, b: ChartLink): number {
  if (!a || !b) {
    return 0;
  }
  const aVal = (a?.row || 0) + ((a?.col || 0) * 1000)
  const bVal = (b.row || 0) + ((a?.col || 0) * 1000)
  return aVal - bVal;
}
