import { getTaxYearConfig } from "~/lib/taxData";
import type { FilingStatus } from "~/lib/taxData";
import type { TaxSegment } from "~/lib/taxCalc.types";

export function calculateFederalTaxBreakdown(
  taxableIncome: number,
  taxYear: number,
  filingStatus: FilingStatus,
): { totalTax: number; segments: TaxSegment[] } {
  if (taxableIncome <= 0) {
    return { totalTax: 0, segments: [] };
  }

  const config = getTaxYearConfig(taxYear);
  if (!config) {
    return { totalTax: 0, segments: [] };
  }

  const brackets = config.federalBrackets[filingStatus];
  let remaining = taxableIncome;
  let lowerBound = 0;
  let totalTax = 0;
  const segments: TaxSegment[] = [];

  for (const [index, bracket] of brackets.entries()) {
    if (remaining <= 0) {
      break;
    }

    const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
    const amountInBracket = Math.min(remaining, upperBound - lowerBound);
    if (amountInBracket > 0) {
      const taxAmount = amountInBracket * bracket.rate;
      totalTax += taxAmount;
      segments.push({
        id: `ordinary-${index}`,
        kind: "ordinaryFederal",
        incomeAmount: amountInBracket,
        taxAmount,
        marginalRate: bracket.rate,
        rangeStart: lowerBound,
        rangeEnd: bracket.upTo,
      });
      remaining -= amountInBracket;
    }

    lowerBound = upperBound;
  }

  return { totalTax, segments };
}
