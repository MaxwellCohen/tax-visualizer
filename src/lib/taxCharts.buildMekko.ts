import type { TaxChartMetrics } from "~/lib/taxForm.types";
import { allocateFederalCreditsTopMarginalSlices } from "~/lib/taxCharts.visualizationBundle";
import { formatLtcgBracketLabel } from "~/lib/taxCharts.sankeyFormat";
import {
  ltcgBracketNodeId,
  ltcgSegmentKey,
  ordinaryBracketNodeId,
  ordinarySegmentKey,
} from "~/lib/taxCharts.sankeySegmentKeys";
import type { MekkoRow } from "~/lib/taxCharts.types";

export function buildMekkoRows(m: TaxChartMetrics): MekkoRow[] {
  const rows: MekkoRow[] = [];
  const federalByNode = allocateFederalCreditsTopMarginalSlices(m);

  if (m.deductionAmount > 0) {
    rows.push({
      id: "deduction",
      label: m.deductionKind === "itemized" ? "Itemized" : "Std Ded",
      total: m.deductionAmount,
      keep: m.deductionAmount,
      tax: 0,
      kind: "deduction",
    });
  }

  for (const segment of m.ordinaryFederalSegments) {
    if (segment.incomeAmount <= 0) continue;
    const nodeId = ordinaryBracketNodeId(segment);
    const tax = federalByNode.get(nodeId)?.federalToTax ?? 0;
    rows.push({
      id: `ordinary-${ordinarySegmentKey(segment)}`,
      label: `Ord. ${Math.round(segment.marginalRate * 100)}%`,
      total: segment.incomeAmount,
      tax,
      keep: Math.max(0, segment.incomeAmount - tax),
      kind: "ordinaryBracket",
      marginalRate: segment.marginalRate,
    });
  }

  for (const segment of m.longTermCapitalGainsSegments) {
    if (segment.incomeAmount <= 0) continue;
    const nodeId = ltcgBracketNodeId(segment);
    const tax = federalByNode.get(nodeId)?.federalToTax ?? 0;
    rows.push({
      id: `ltcg-${ltcgSegmentKey(segment)}`,
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
