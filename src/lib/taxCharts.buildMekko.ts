import type { TaxResult } from "~/lib/taxCalc";
import { formatLtcgBracketLabel } from "~/lib/taxCharts.sankeyFormat";
import { netInvestmentIncomeTaxPerSegment } from "~/lib/taxCharts.sankeyNiit";
import type { MekkoRow } from "~/lib/taxCharts.types";

export function buildMekkoRows(result: TaxResult): MekkoRow[] {
  const rows: MekkoRow[] = [];
  const niitBySegment = netInvestmentIncomeTaxPerSegment(result);

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
    const niitPart = niitBySegment.ordinary.get(segment.id) ?? 0;
    const tax = segment.taxAmount + niitPart;
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
    const niitPart = niitBySegment.ltcg.get(segment.id) ?? 0;
    const tax = segment.taxAmount + niitPart;
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
