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

  const ordinarySegments = getOrdinaryFederalSegments(result);
  for (const segment of ordinarySegments) {
    if (segment.incomeAmount <= 0) continue;
    const nodeId = ordinaryBracketNodeId(segment);
    const afterCredits = federalByNodeResolved.get(nodeId);
    const tax = afterCredits?.federalToTax ?? 0;
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

  const ltcgSegments = getLongTermCapitalGainsSegments(result);
  for (const segment of ltcgSegments) {
    if (segment.incomeAmount <= 0) continue;
    const nodeId = ltcgBracketNodeId(segment);
    const afterCredits = federalByNodeResolved.get(nodeId);
    const tax = afterCredits?.federalToTax ?? 0;
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

  const preTaxTotal = chartMetricNumeric(result, "preTaxTotal");
  if (preTaxTotal > 0) {
    rows.push({
      id: "pretax",
      label: "Pre-Tax",
      total: preTaxTotal,
      keep: preTaxTotal,
      tax: 0,
      kind: "pretax",
    });
  }

  const selfEmploymentTax = chartMetricNumeric(result, "selfEmploymentTax");
  if (selfEmploymentTax > 0) {
    rows.push({
      id: "self-employment-tax",
      label: "SE Tax",
      total: selfEmploymentTax,
      keep: 0,
      tax: selfEmploymentTax,
      kind: "deduction",
    });
  }

  return rows;
}
