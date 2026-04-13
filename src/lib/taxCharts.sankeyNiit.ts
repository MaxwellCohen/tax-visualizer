import type { TaxResult } from "~/lib/taxForm.types";
import {
  chartMetricNumeric,
  getLongTermCapitalGainsSegments,
  getOrdinaryFederalSegments,
} from "~/lib/taxChartMetricRead";
import type { TaxSegment } from "~/lib/taxCalc.types";
import { ltcgSegmentKey, ordinarySegmentKey } from "~/lib/taxCharts.sankeySegmentKeys";

/** Split NIIT across bracket slices so Sankey/Mekko tax flows match total federal tax. */
export function netInvestmentIncomeTaxPerSegment(result: TaxResult): {
  ordinary: Map<string, number>;
  ltcg: Map<string, number>;
} {
  const ordinary = new Map<string, number>();
  const ltcg = new Map<string, number>();
  const niit = chartMetricNumeric(result, "federalNetInvestmentIncomeTax");
  const nii = chartMetricNumeric(result, "netInvestmentIncome");
  if (niit <= 0 || nii <= 0) {
    return { ordinary, ltcg };
  }

  const longTermTaxableIncome = chartMetricNumeric(result, "longTermTaxableIncome");
  const stNii = Math.max(0, nii - longTermTaxableIncome);
  const ltNii = nii - stNii;
  const ordinaryPool = niit * (stNii / nii);
  const ltcgPool = niit * (ltNii / nii);

  const allocatePool = (
    pool: number,
    segments: TaxSegment[],
    totalIncome: number,
    into: Map<string, number>,
    keyOf: (seg: TaxSegment) => string,
  ) => {
    if (pool <= 0 || totalIncome <= 0 || !segments?.length) return;
    let allocated = 0;
    segments.forEach((seg, i) => {
      const last = i === segments.length - 1;
      const part = last ? Math.max(0, pool - allocated) : Math.round((pool * seg.incomeAmount) / totalIncome);
      allocated += part;
      into.set(keyOf(seg), part);
    });
  };

  allocatePool(
    ordinaryPool,
    getOrdinaryFederalSegments(result),
    chartMetricNumeric(result, "ordinaryTaxableIncome"),
    ordinary,
    ordinarySegmentKey,
  );
  allocatePool(
    ltcgPool,
    getLongTermCapitalGainsSegments(result),
    longTermTaxableIncome,
    ltcg,
    ltcgSegmentKey,
  );
  return { ordinary, ltcg };
}
