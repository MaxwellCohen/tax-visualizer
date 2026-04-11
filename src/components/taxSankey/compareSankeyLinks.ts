import type { ChartLink, ChartNode } from "~/components/taxSankey/chartTypes";
import { compareSankeySiblings } from "~/components/taxSankey/compareSankeySiblings";

function compareLinkedNodes(a: ChartNode, b: ChartNode): number {
  const rankDiff = compareSankeySiblings(a, b);
  if (rankDiff !== 0) return rankDiff;
  return a.label.localeCompare(b.label);
}

export function compareSankeyLinks(a: ChartLink, b: ChartLink): number {
  const sourceA = a.source as ChartNode;
  const sourceB = b.source as ChartNode;
  const targetA = a.target as ChartNode;
  const targetB = b.target as ChartNode;

  if (sourceA === sourceB) {
    return compareLinkedNodes(targetA, targetB);
  }

  if (targetA === targetB) {
    return compareLinkedNodes(sourceA, sourceB);
  }

  const sourceDiff = compareLinkedNodes(sourceA, sourceB);
  if (sourceDiff !== 0) return sourceDiff;
  return compareLinkedNodes(targetA, targetB);
}
