import type { TaxResult } from "~/lib/taxCalc";
import { allocateFederalCreditsTopMarginalSlices } from "~/lib/taxCharts.visualizationBundle";
import { formatLtcgBracketLabel } from "~/lib/taxCharts.sankeyFormat";
import type { MekkoRow } from "~/lib/taxCharts.types";

export function buildMekkoRows(result: TaxResult): MekkoRow[] {
  const rows: MekkoRow[] = [];
  const federalByNode = allocateFederalCreditsTopMarginalSlices(result);

  if (result.deductionAmount > 0) {
    rows.push({
      id: "deduction",
      label: result.deductionKind === "itemized" ? "Itemized" : "Std Ded",
      total: result.deductionAmount,
      keep: result.deductionAmount,
      tax: 0,
      kind: "deduction",
    });
  }

  for (const segment of result.ordinaryFederalSegments) {
    if (segment.incomeAmount <= 0) continue;
    const nodeId = `ordinary-bracket-${segment.id}`;
    const tax = federalByNode.get(nodeId)?.federalToTax ?? 0;
    rows.push({
      id: `ordinary-${segment.id}`,
      label: `Ord. ${Math.round(segment.marginalRate * 100)}%`,
      total: segment.incomeAmount,
      tax,
      keep: Math.max(0, segment.incomeAmount - tax),
      kind: "ordinaryBracket",
      marginalRate: segment.marginalRate,
    });
  }

  for (const segment of result.longTermCapitalGainsSegments) {
    if (segment.incomeAmount <= 0) continue;
    const nodeId = `ltcg-bracket-${segment.id}`;
    const tax = federalByNode.get(nodeId)?.federalToTax ?? 0;
    rows.push({
      id: `ltcg-${segment.id}`,
      label: formatLtcgBracketLabel(segment),
      total: segment.incomeAmount,
      tax,
      keep: Math.max(0, segment.incomeAmount - tax),
      kind: "ltcgBracket",
      marginalRate: segment.marginalRate,
    });
  }

  return rows;
}
