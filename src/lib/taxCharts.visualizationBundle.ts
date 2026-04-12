import type { TaxResult } from "~/lib/taxCalc";
import { netInvestmentIncomeTaxPerSegment } from "~/lib/taxCharts.sankeyNiit";

/**
 * Derived chart numbers from `TaxResult` only. Authoritative tax math lives in
 * `calculateTaxes`; this module is the single place charts read allocation rules from.
 */

/** Per Sankey/Mekko node id: federal income tax + NIIT still owed after credits, and credits absorbed by that slice. */
export type FederalSliceAfterCredits = { federalToTax: number; creditPortion: number };

/**
 * Attribute nonrefundable federal credits to the highest marginal-rate bracket slices first, then the next-highest,
 * so Sankey and Mekko agree on how credits reduce tax per band (net federal tax matches `TaxResult` either way).
 */
export function allocateFederalCreditsTopMarginalSlices(result: TaxResult): Map<string, FederalSliceAfterCredits> {
  type Row = { nodeId: string; federalGross: number; marginalRate: number };
  const rows: Row[] = [];
  const niitBySegment = netInvestmentIncomeTaxPerSegment(result);

  for (const segment of result.ordinaryFederalSegments) {
    const segmentId = segment.id ?? `ordinary-${segment.rangeStart}`;
    const nodeId = `ordinary-bracket-${segmentId}`;
    const niitPart = niitBySegment.ordinary.get(segmentId) ?? 0;
    rows.push({
      nodeId,
      federalGross: segment.taxAmount + niitPart,
      marginalRate: segment.marginalRate,
    });
  }
  for (const segment of result.longTermCapitalGainsSegments) {
    const segmentId = segment.id ?? `ltcg-${segment.rangeStart}`;
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

  const totalCredits = result.federalTaxCreditsApplied;
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
 * Uniform ratio of net federal tax to federal tax before credits (handy when a proportional split is enough).
 * Bracket-level Mekko/Sankey flows prefer {@link allocateFederalCreditsTopMarginalSlices}.
 */
export function federalIncomeTaxCreditApplyRatio(result: TaxResult): number {
  const before = result.federalIncomeTaxBeforeCredits;
  if (before <= 0) {
    return result.federalIncomeTax <= 0 ? 0 : 1;
  }
  return result.federalIncomeTax / before;
}

/**
 * Cash take-home attributed through ordinary/LTCG bracket flows in the Sankey (excludes the
 * federal-credits → take-home ribbon, which is layered separately).
 */
export function takeHomeAttributableToBracketFlows(result: TaxResult): number {
  return Math.max(0, result.takeHomePay - result.federalTaxCreditsApplied);
}

/** Retained slice weight for splitting take-home / payroll across bracket nodes (income minus federal + NIIT on that slice). */
export function bracketSliceRetainedWeight(incomeAmount: number, taxWithNiit: number): number {
  return Math.max(0, incomeAmount - taxWithNiit);
}

/** Dollars flowing out of `deduction-shield` for the deduction slice (matches routed inflows; may be below `deductionAmount` when the deduction exceeds gross income). */
export function deductionShieldAccountingOutflow(result: TaxResult): number {
  return result.deductionAllocatedToOrdinary + result.deductionAllocatedToLongTermGross;
}
