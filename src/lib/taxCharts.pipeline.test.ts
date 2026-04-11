import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource } from "~/lib/taxCalc";
import { baseInput } from "~/lib/taxCalc.test.helpers";
import { buildMekkoRows, buildSankeyChartData, INCOME_KIND_CHART_ORDER } from "~/lib/taxCharts";

describe("taxCharts pipeline", () => {
  it("exports income kind order", () => {
    expect(INCOME_KIND_CHART_ORDER.longTermCapGains).toBeLessThan(INCOME_KIND_CHART_ORDER.wages);
  });

  it("buildMekkoRows includes deduction and bracket rows", () => {
    const result = calculateTaxes(
      baseInput({
        useItemizedDeductions: true,
        itemizedDeductions: 30_000,
      }),
    );
    expect(result).not.toBeNull();
    const rows = buildMekkoRows(result!);
    expect(rows.some(r => r.kind === "deduction")).toBe(true);
    expect(rows.some(r => r.kind === "ordinaryBracket")).toBe(true);
  });

  it("buildSankeyChartData produces nodes and links", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 120_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 25_000 }),
        ],
        preTax401kSpouse1: 10_000,
      }),
    );
    expect(result).not.toBeNull();
    const chart = buildSankeyChartData(result!);
    expect(chart.nodes.length).toBeGreaterThan(3);
    expect(chart.links.length).toBeGreaterThan(2);
  });

  it("buildSankeyChartData covers NIIT allocation path", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 220_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 50_000 }),
        ],
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.federalNetInvestmentIncomeTax).toBeGreaterThan(0);
    const chart = buildSankeyChartData(result!);
    expect(chart.nodes.some(n => n.kind === "ltcgBracket")).toBe(true);
  });

  it("buildSankeyChartData itemized deduction branch", () => {
    const result = calculateTaxes(
      baseInput({
        useItemizedDeductions: true,
        itemizedDeductions: 28_000,
      }),
    );
    expect(result).not.toBeNull();
    const chart = buildSankeyChartData(result!);
    expect(chart.nodes.some(n => n.kind === "standardDeduction")).toBe(true);
  });
});
