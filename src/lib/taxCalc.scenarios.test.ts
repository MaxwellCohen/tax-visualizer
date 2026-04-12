import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource } from "~/lib/taxCalc";
import {
  allocateFederalCreditsTopMarginalSlices,
  buildMekkoRows,
  buildSankeyChartData,
} from "~/lib/taxCharts";
import { getAvailableTaxYears } from "~/lib/taxData";
import { deserializeScenarioInput, serializeScenarioInput } from "~/lib/taxScenario";
import { baseInput, withFederalCreditsTotal, withItemizedTotal, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import type { TaxInput } from "~/lib/taxCalc.types";

/** Sum of federal + NIIT tax attributed to Mekko bracket bands (excludes deduction band). */
function mekkoBracketTaxSum(rows: ReturnType<typeof buildMekkoRows>): number {
  return rows.filter(r => r.kind === "ordinaryBracket" || r.kind === "ltcgBracket").reduce((s, r) => s + r.tax, 0);
}

describe("calculateTaxes scenario snapshots", () => {
  const scenarios: { name: string; input: TaxInput }[] = [
    {
      name: "2025 single wages + standard path",
      input: baseInput({
        taxYear: 2025,
        filingStatus: "single",
        incomeSources: [newIncomeSource({ kind: "wages", amount: 85_000 })],
        pretaxBenefitSources: withPretaxTotals({ preTax401kSpouse1: 0 }),
      }),
    },
    {
      name: "wages + long-term gains stacking",
      input: baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 120_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 25_000 }),
        ],
        pretaxBenefitSources: withPretaxTotals({ preTax401kSpouse1: 10_000 }),
      }),
    },
    {
      name: "itemized + federal credits",
      input: baseInput({
        useItemizedDeductions: true,
        itemizedDeductions: withItemizedTotal(30_000),
        federalTaxCredits: withFederalCreditsTotal(4_000),
        incomeSources: [newIncomeSource({ kind: "wages", amount: 150_000 })],
      }),
    },
  ];

  it.each(scenarios)("$name produces TaxResult with coherent totals", ({ input }) => {
    const result = calculateTaxes(input);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.totalIncome).toBeGreaterThan(0);
    expect(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
    expect(result.federalIncomeTax).toBeLessThanOrEqual(result.federalIncomeTaxBeforeCredits);
    expect(result.takeHomePay).toBeGreaterThanOrEqual(0);
    expect(result.taxableIncome).toBeGreaterThanOrEqual(0);
  });
});

describe("charts vs TaxResult consistency", () => {
  it("Mekko bracket taxes sum to federal income tax (after credits)", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 140_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 15_000 }),
        ],
        federalTaxCredits: withFederalCreditsTotal(2_500),
      }),
    );
    expect(result).not.toBeNull();
    if (!result) return;

    const rows = buildMekkoRows(result);
    const sum = mekkoBracketTaxSum(rows);
    expect(Math.abs(sum - result.federalIncomeTax)).toBeLessThanOrEqual(1);
  });

  it("allocateFederalCreditsTopMarginalSlices federalToTax sums to federal income tax", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [newIncomeSource({ kind: "wages", amount: 95_000 })],
        federalTaxCredits: withFederalCreditsTotal(1_200),
      }),
    );
    expect(result).not.toBeNull();
    if (!result) return;

    const m = allocateFederalCreditsTopMarginalSlices(result);
    let total = 0;
    for (const v of m.values()) {
      total += v.federalToTax;
    }
    expect(Math.abs(total - result.federalIncomeTax)).toBeLessThanOrEqual(1);
  });

  it("Sankey chart builds from same result without throwing", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 100_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 20_000 }),
        ],
      }),
    );
    expect(result).not.toBeNull();
    if (!result) return;
    const chart = buildSankeyChartData(result);
    expect(chart.nodes.length).toBeGreaterThan(0);
  });
});

describe("serialize → deserialize → calculateTaxes", () => {
  it("round-trips scenario JSON to the same effective tax outcome", () => {
    const input = baseInput({
      taxYear: 2024,
      incomeSources: [newIncomeSource({ kind: "wages", amount: 72_000 })],
      pretaxBenefitSources: withPretaxTotals({ preTax401kSpouse1: 6_000 }),
    });
    const years = getAvailableTaxYears();
    const json = serializeScenarioInput(input);
    const back = deserializeScenarioInput(json, years, 2025);
    expect(back).not.toBeNull();
    if (!back) return;

    const a = calculateTaxes(input)!;
    const b = calculateTaxes(back)!;
    expect(a.federalIncomeTax).toBe(b.federalIncomeTax);
    expect(a.payrollTax).toBe(b.payrollTax);
    expect(a.takeHomePay).toBe(b.takeHomePay);
  });
});
