import type { TaxResult } from "~/lib/taxForm.types";
import {
  chartMetricNumeric,
  deductionKindFromTaxResult,
  getLongTermCapitalGainsSegments,
  getOrdinaryFederalSegments,
} from "~/lib/taxChartMetricRead";
import {
  allocateFederalCreditsTopMarginalSlices,
  type FederalSliceAfterCredits,
} from "~/lib/taxCharts.visualizationBundle";
import { formatLtcgBracketLabel } from "~/lib/taxCharts.sankeyFormat";
import {
  ltcgBracketNodeId,
  ltcgSegmentKey,
  ordinaryBracketNodeId,
  ordinarySegmentKey,
} from "~/lib/taxCharts.sankeySegmentKeys";
import type { MekkoRow } from "~/lib/taxCharts.types";

export function buildMekkoRows(
  result: TaxResult,
  federalByNode?: Map<string, FederalSliceAfterCredits>,
): MekkoRow[] {
  const rows: MekkoRow[] = [];
  const federalByNodeResolved = federalByNode ?? allocateFederalCreditsTopMarginalSlices(result);

  const deductionAmount = chartMetricNumeric(result, "deductionAmount");
  if (deductionAmount > 0) {
    rows.push({
      id: "deduction",
      label: deductionKindFromTaxResult(result) === "itemized" ? "Itemized" : "Std Ded",
      total: deductionAmount,
      keep: deductionAmount,
      tax: 0,
      kind: "deduction",
    });
  }

  for (const segment of getOrdinaryFederalSegments(result)) {
    if (segment.incomeAmount <= 0) continue;
    const nodeId = ordinaryBracketNodeId(segment);
    const tax = federalByNodeResolved.get(nodeId)?.federalToTax ?? 0;
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

  for (const segment of getLongTermCapitalGainsSegments(result)) {
    if (segment.incomeAmount <= 0) continue;
    const nodeId = ltcgBracketNodeId(segment);
    const tax = federalByNodeResolved.get(nodeId)?.federalToTax ?? 0;
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
