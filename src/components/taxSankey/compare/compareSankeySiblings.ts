import type { ChartNode } from "~/components/taxSankey/types/chartTypes";

export function compareSankeySiblings(a: ChartNode, b: ChartNode): number {
  if (a.row != null && b.row != null && a.col != null && b.col != null) {
    return a.row - b.row;
  }
  return 0;
}
