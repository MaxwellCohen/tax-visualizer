import type { TaxSegment } from "~/lib/taxCalc.types";

/** Preferential LTCG rates stacked on top of ordinary taxable income (simplified; not tax advice). */
export function calculateLongTermCapGainsTax(
  ordinaryTaxableIncome: number,
  longTermTaxableIncome: number,
  thresholds: { zeroRateMax: number; fifteenRateMax: number },
): { totalTax: number; segments: TaxSegment[] } {
  if (longTermTaxableIncome <= 0) {
    return { totalTax: 0, segments: [] };
  }

  const { zeroRateMax, fifteenRateMax } = thresholds;
  let remaining = longTermTaxableIncome;
  let totalTax = 0;
  const segments: TaxSegment[] = [];

  const takeSlice = (rate: number, maxDollars: number, rangeStart: number, rangeEnd: number | null) => {
    if (maxDollars <= 0 || remaining <= 0) return;
    const amount = Math.min(remaining, maxDollars);
    if (amount <= 0) return;

    const taxAmount = amount * rate;
    totalTax += taxAmount;
    segments.push({
      id: `ltcg-${Math.round(rate * 100)}`,
      incomeAmount: amount,
      taxAmount,
      marginalRate: rate,
      rangeStart,
      rangeEnd,
    });
    remaining -= amount;
  };

  const space0 = Math.max(0, zeroRateMax - ordinaryTaxableIncome);
  takeSlice(0, space0, 0, zeroRateMax);

  const space15 = Math.max(0, fifteenRateMax - Math.max(ordinaryTaxableIncome, zeroRateMax));
  takeSlice(0.15, space15, zeroRateMax, fifteenRateMax);

  takeSlice(0.2, remaining, fifteenRateMax, null);

  return { totalTax, segments };
}
