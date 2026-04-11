import type { TaxResult, TaxSegment } from "~/lib/taxCalc";

/** Split NIIT across bracket slices so Sankey/Mekko tax flows match total federal tax. */
export function netInvestmentIncomeTaxPerSegment(result: TaxResult): {
  ordinary: Map<string, number>;
  ltcg: Map<string, number>;
} {
  const ordinary = new Map<string, number>();
  const ltcg = new Map<string, number>();
  const niit = result.federalNetInvestmentIncomeTax;
  const nii = result.netInvestmentIncome;
  if (niit <= 0 || nii <= 0) {
    return { ordinary, ltcg };
  }

  const stNii = Math.max(0, nii - result.longTermTaxableIncome);
  const ltNii = nii - stNii;
  const ordinaryPool = niit * (stNii / nii);
  const ltcgPool = niit * (ltNii / nii);

  const allocatePool = (
    pool: number,
    segments: TaxSegment[],
    totalIncome: number,
    into: Map<string, number>,
  ) => {
    if (pool <= 0 || totalIncome <= 0 || !segments?.length) return;
    let allocated = 0;
    segments.forEach((seg, i) => {
      const last = i === segments.length - 1;
      const part = last ? Math.max(0, pool - allocated) : Math.round((pool * seg.incomeAmount) / totalIncome);
      allocated += part;
      into.set(seg.id, part);
    });
  };

  allocatePool(ordinaryPool, result.ordinaryFederalSegments, result.ordinaryTaxableIncome, ordinary);
  allocatePool(ltcgPool, result.longTermCapitalGainsSegments, result.longTermTaxableIncome, ltcg);
  return { ordinary, ltcg };
}
