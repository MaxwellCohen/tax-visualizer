import type { TaxChartMetrics } from "~/lib/taxForm.types";
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
export function allocateFederalCreditsTopMarginalSlices(m: TaxChartMetrics): Map<string, FederalSliceAfterCredits> {
  type Row = { nodeId: string; federalGross: number; marginalRate: number };
  const rows: Row[] = [];
  const niitBySegment = netInvestmentIncomeTaxPerSegment(m);

  for (const segment of m.ordinaryFederalSegments) {
    const segmentId = ordinarySegmentKey(segment);
    const nodeId = `ordinary-bracket-${segmentId}`;
    const niitPart = niitBySegment.ordinary.get(segmentId) ?? 0;
    rows.push({
      nodeId,
      federalGross: segment.taxAmount + niitPart,
      marginalRate: segment.marginalRate,
    });
  }
  for (const segment of m.longTermCapitalGainsSegments) {
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

  const totalCredits = m.federalTaxCreditsApplied;
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
export function federalIncomeTaxCreditApplyRatio(m: TaxChartMetrics): number {
  const before = m.federalIncomeTaxBeforeCredits;
  if (before <= 0) {
    return m.federalIncomeTax <= 0 ? 0 : 1;
  }
  return m.federalIncomeTax / before;
}

/**
 * Cash take-home attributed through ordinary/LTCG bracket flows in the Sankey (excludes the
 * federal-credits → take-home ribbon, which is layered separately).
 */
export function takeHomeAttributableToBracketFlows(m: TaxChartMetrics): number {
  return Math.max(0, m.takeHomePay - m.federalTaxCreditsApplied);
}

/** Retained slice weight for splitting take-home / payroll across bracket nodes (income minus federal + NIIT on that slice). */
export function bracketSliceRetainedWeight(incomeAmount: number, taxWithNiit: number): number {
  return Math.max(0, incomeAmount - taxWithNiit);
}

/**
 * Total deduction dollars the Sankey routes through the shield when the tax pipeline has not yet
 * populated allocation fields (they may be 0 while `deductionAmount` is still correct).
 */
export function effectiveDeductionShelteredTotal(m: TaxChartMetrics): number {
  const allocated = m.deductionAllocatedToOrdinary + m.deductionAllocatedToLongTermGross;
  if (allocated > 0) return allocated;
  return m.deductionAmount > 0 ? m.deductionAmount : 0;
}

/** Portion of the deduction attributed to ordinary income rows (vs LTCG gross shield). */
export function effectiveDeductionToOrdinary(m: TaxChartMetrics): number {
  if (m.deductionAllocatedToOrdinary > 0) return m.deductionAllocatedToOrdinary;
  if (m.deductionAllocatedToOrdinary + m.deductionAllocatedToLongTermGross > 0) {
    return m.deductionAllocatedToOrdinary;
  }
  const total = effectiveDeductionShelteredTotal(m);
  if (total <= 0) return 0;
  const ltcgShelteredByDeduction = Math.max(
    0,
    m.longTermCapitalGainsGrossIncome - m.longTermTaxableIncome,
  );
  const toLtcg = Math.min(ltcgShelteredByDeduction, total);
  return Math.max(0, total - toLtcg);
}

/** Portion flowing from `ltcgDeductionShield` into the deduction bar (when applicable). */
export function effectiveDeductionToLtcgGrossShield(m: TaxChartMetrics): number {
  if (m.deductionAllocatedToLongTermGross > 0) return m.deductionAllocatedToLongTermGross;
  if (m.deductionAllocatedToOrdinary + m.deductionAllocatedToLongTermGross > 0) {
    return m.deductionAllocatedToLongTermGross;
  }
  const total = effectiveDeductionShelteredTotal(m);
  if (total <= 0) return 0;
  const ltcgShelteredByDeduction = Math.max(
    0,
    m.longTermCapitalGainsGrossIncome - m.longTermTaxableIncome,
  );
  return Math.min(ltcgShelteredByDeduction, total);
}

/** Dollars flowing out of `deduction-shield` for the deduction slice (matches routed inflows; may be below `deductionAmount` when the deduction exceeds gross income). */
export function deductionShieldAccountingOutflow(m: TaxChartMetrics): number {
  return effectiveDeductionShelteredTotal(m);
}
