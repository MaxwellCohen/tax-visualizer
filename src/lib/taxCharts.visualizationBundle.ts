import type { TaxResult } from "~/lib/taxForm.types";
import {
  chartMetricNumeric,
  getLongTermCapitalGainsSegments,
  getOrdinaryFederalSegments,
} from "~/lib/taxChartMetricRead";
import { netInvestmentIncomeTaxPerSegment } from "~/lib/taxCharts.sankeyNiit";
import { ltcgSegmentKey, ordinarySegmentKey } from "~/lib/taxCharts.sankeySegmentKeys";

/**
 * Derived chart numbers from resolved metrics only. Authoritative tax math lives in
 * `calculateTaxes`; this module is the single place charts read allocation rules from.
 */

/** Per Sankey/Mekko node id: federal income tax + NIIT still owed after credits, and credits absorbed by that slice. */
export type FederalSliceAfterCredits = { federalToTax: number; creditPortion: number };

/**
 * Attribute nonrefundable federal credits to the highest marginal-rate bracket slices first, then the next-highest,
 * so Sankey and Mekko agree on how credits reduce tax per band (net federal tax matches totals either way).
 */
export function allocateFederalCreditsTopMarginalSlices(result: TaxResult): Map<string, FederalSliceAfterCredits> {
  type Row = { nodeId: string; federalGross: number; marginalRate: number };
  const rows: Row[] = [];
  const niitBySegment = netInvestmentIncomeTaxPerSegment(result);

  for (const segment of getOrdinaryFederalSegments(result)) {
    const segmentId = ordinarySegmentKey(segment);
    const nodeId = `ordinary-bracket-${segmentId}`;
    const niitPart = niitBySegment.ordinary.get(segmentId) ?? 0;
    rows.push({
      nodeId,
      federalGross: segment.taxAmount + niitPart,
      marginalRate: segment.marginalRate,
    });
  }
  for (const segment of getLongTermCapitalGainsSegments(result)) {
    const segmentId = ltcgSegmentKey(segment);
    const nodeId = `ltcg-bracket-${segmentId}`;
    const niitPart = niitBySegment.ltcg.get(segmentId) ?? 0;
    rows.push({
      nodeId,
      federalGross: segment.taxAmount + niitPart,
      marginalRate: segment.marginalRate,
    });
  }

  const out = new Map<string, FederalSliceAfterCredits>();
  for (const r of rows) {
    out.set(r.nodeId, { federalToTax: r.federalGross, creditPortion: 0 });
  }

  const totalCredits = chartMetricNumeric(result, "federalTaxCreditsApplied");
  if (totalCredits <= 0 || rows.length === 0) {
    return out;
  }

  rows.sort((a, b) => {
    const rd = b.marginalRate - a.marginalRate;
    if (rd !== 0) return rd;
    return b.federalGross - a.federalGross;
  });

  let remaining = totalCredits;
  for (const r of rows) {
    if (remaining <= 0) break;
    if (r.federalGross <= 0) continue;
    const creditPortion = Math.min(remaining, r.federalGross);
    const federalToTax = r.federalGross - creditPortion;
    out.set(r.nodeId, { federalToTax, creditPortion });
    remaining -= creditPortion;
  }

  return out;
}

/**
 * Cash take-home attributed through ordinary/LTCG bracket flows in the Sankey (excludes the
 * federal-credits → take-home ribbon, which is layered separately).
 */
export function takeHomeAttributableToBracketFlows(result: TaxResult): number {
  return Math.max(
    0,
    chartMetricNumeric(result, "takeHomePay") - chartMetricNumeric(result, "federalTaxCreditsApplied"),
  );
}





