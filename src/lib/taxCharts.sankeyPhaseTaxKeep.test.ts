import { describe, expect, it } from "vitest";
import { allocateFederalCreditsTopMarginalSlices } from "~/lib/taxCharts.visualizationBundle";
import type { TaxResult } from "~/lib/taxCalc.types";

function seg(
  id: string,
  kind: "ordinaryFederal" | "longTermCapGains",
  taxAmount: number,
  marginalRate: number,
) {
  return {
    id,
    kind,
    incomeAmount: 10_000,
    taxAmount,
    marginalRate,
    rangeStart: 0,
    rangeEnd: null as number | null,
  };
}

describe("allocateFederalCreditsTopMarginalSlices", () => {
  it("assigns credits from highest marginal rate slice first, then lower", () => {
    const result = {
      federalTaxCreditsApplied: 3_000,
      federalNetInvestmentIncomeTax: 0,
      netInvestmentIncome: 0,
      ordinaryFederalSegments: [
        seg("a", "ordinaryFederal", 2_000, 0.12),
        seg("b", "ordinaryFederal", 8_000, 0.22),
      ],
      longTermCapitalGainsSegments: [],
    } as unknown as TaxResult;

    const m = allocateFederalCreditsTopMarginalSlices(result);

    expect(m.get("ordinary-bracket-b")).toEqual({ federalToTax: 5_000, creditPortion: 3_000 });
    expect(m.get("ordinary-bracket-a")).toEqual({ federalToTax: 2_000, creditPortion: 0 });
  });

  it("spills to the next slice when the top slice cannot absorb all credits", () => {
    const result = {
      federalTaxCreditsApplied: 9_000,
      federalNetInvestmentIncomeTax: 0,
      netInvestmentIncome: 0,
      ordinaryFederalSegments: [
        seg("a", "ordinaryFederal", 2_000, 0.12),
        seg("b", "ordinaryFederal", 8_000, 0.22),
      ],
      longTermCapitalGainsSegments: [],
    } as unknown as TaxResult;

    const m = allocateFederalCreditsTopMarginalSlices(result);

    expect(m.get("ordinary-bracket-b")).toEqual({ federalToTax: 0, creditPortion: 8_000 });
    expect(m.get("ordinary-bracket-a")).toEqual({ federalToTax: 1_000, creditPortion: 1_000 });
  });

  it("orders LTCG slices by marginal rate with ordinary slices", () => {
    const result = {
      federalTaxCreditsApplied: 500,
      federalNetInvestmentIncomeTax: 0,
      netInvestmentIncome: 0,
      ordinaryFederalSegments: [seg("o", "ordinaryFederal", 1_000, 0.1)],
      longTermCapitalGainsSegments: [seg("l", "longTermCapGains", 4_000, 0.15)],
    } as unknown as TaxResult;

    const m = allocateFederalCreditsTopMarginalSlices(result);
    expect(m.get("ltcg-bracket-l")?.creditPortion).toBe(500);
    expect(m.get("ordinary-bracket-o")?.creditPortion).toBe(0);
  });
});
