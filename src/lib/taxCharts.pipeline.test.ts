import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource } from "~/lib/taxCalc";
import { baseInput, withFederalCreditsTotal, withItemizedTotal, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { buildMekkoRows, buildSankeyChartData, INCOME_KIND_CHART_ORDER, INCOME_KIND_CHART_ORDER_BY_KIND } from "~/lib/taxCharts";

describe("taxCharts pipeline", () => {
  it("exports income kind order as array", () => {
    const ltcgIdx = INCOME_KIND_CHART_ORDER.indexOf("longTermCapGains");
    const wagesIdx = INCOME_KIND_CHART_ORDER.indexOf("wages");
    expect(ltcgIdx).toBeLessThan(wagesIdx);
  });

  it("exports income kind order by kind as record", () => {
    expect(INCOME_KIND_CHART_ORDER_BY_KIND.longTermCapGains).toBeLessThan(INCOME_KIND_CHART_ORDER_BY_KIND.wages);
  });

  it("buildMekkoRows includes deduction and bracket rows", () => {
    const result = calculateTaxes(
      baseInput({
        useItemizedDeductions: true,
        itemizedDeductions: withItemizedTotal(30_000),
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
        pretaxBenefitSources: withPretaxTotals({ preTax401kSpouse1: 10_000 }),
      }),
    );
    expect(result).not.toBeNull();
    const chart = buildSankeyChartData(result!);
    expect(chart.nodes.length).toBeGreaterThan(3);
    expect(chart.links.length).toBeGreaterThan(2);
  });

  it("buildSankeyChartData does not route payroll from shielded-income to taxes; pretax exits to deferred sinks", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [newIncomeSource({ kind: "wages", amount: 120_000 })],
        pretaxBenefitSources: withPretaxTotals({ preTax401kSpouse1: 10_000 }),
      }),
    );
    expect(result).not.toBeNull();
    const chart = buildSankeyChartData(result!);
    expect(
      chart.links.some(
        l =>
          l.sourceId === "deduction-shield" &&
          (l.targetId === "taxes-federal" || l.targetId === "taxes-payroll"),
      ),
    ).toBe(false);
    expect(
      chart.links.some(
        l => l.sourceId === "deduction-shield" && l.targetId.startsWith("deferred-"),
      ),
    ).toBe(true);
  });

  it("buildSankeyChartData merges standard deduction shield into the single take-home node", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [newIncomeSource({ kind: "wages", amount: 85_000 })],
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.deductionKind).toBe("standard");
    const chart = buildSankeyChartData(result!);
    expect(chart.nodes.some(n => n.kind === "deductionBenefitSink")).toBe(false);
    expect(
      chart.links.some(
        l =>
          l.sourceId === "deduction-shield" &&
          l.targetId === "keep" &&
          l.value === result!.deductionAmount,
      ),
    ).toBe(true);
    expect(chart.nodes.find(n => n.id === "keep")?.label).toBe("Take-home");
  });

  it("buildSankeyChartData frames itemized shield as accounting (not extra cash)", () => {
    const result = calculateTaxes(
      baseInput({
        useItemizedDeductions: true,
        itemizedDeductions: withItemizedTotal(28_000),
        incomeSources: [newIncomeSource({ kind: "wages", amount: 100_000 })],
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.deductionAmount).toBeGreaterThan(0);
    const chart = buildSankeyChartData(result!);
    expect(
      chart.links.some(l => l.sourceId === "deduction-shield" && l.targetId === "keep"),
    ).toBe(true);
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

  it("buildSankeyChartData routes standard deduction from ordinary rows and ltcgDeductionShield, not LTCG income rows", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 10_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 100_000, label: "Brokerage" }),
        ],
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.deductionAllocatedToLongTermGross).toBeGreaterThan(0);
    const chart = buildSankeyChartData(result!);
    expect(chart.nodes.some(n => n.kind === "ltcgDeductionShield")).toBe(true);
    const ltcgIncomeIds = new Set(
      result!.incomeSources.filter(s => s.kind === "longTermCapGains").map(s => `income-${s.id}`),
    );
    const deductionTargets = new Set(["deduction", "standard-deduction"]);
    const ltcgRowToDeduction = chart.links.filter(
      l => deductionTargets.has(l.targetId) && ltcgIncomeIds.has(l.sourceId),
    );
    expect(ltcgRowToDeduction.length).toBe(0);
    expect(
      chart.links.some(
        l => l.sourceId === "ltcg-deduction-shield" && l.targetId === "deduction" && l.value > 0,
      ),
    ).toBe(true);
  });

  it("buildSankeyChartData itemized deduction branch", () => {
    const result = calculateTaxes(
      baseInput({
        useItemizedDeductions: true,
        itemizedDeductions: withItemizedTotal(28_000),
      }),
    );
    expect(result).not.toBeNull();
    const chart = buildSankeyChartData(result!);
    expect(chart.nodes.some(n => n.kind === "deduction")).toBe(true);
  });

  it("buildSankeyChartData includes federal credits node and flow to take-home when credits apply", () => {
    const result = calculateTaxes(
      baseInput({
        federalTaxCredits: withFederalCreditsTotal(2_000),
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.federalTaxCreditsApplied).toBeGreaterThan(0);
    const chart = buildSankeyChartData(result!);
    const creditsNode = chart.nodes.find(n => n.kind === "federalCredits");
    expect(creditsNode).toBeDefined();
    expect(creditsNode?.amount).toBe(result!.federalTaxCreditsApplied);
    expect(
      chart.links.some(
        l => l.sourceId === "federal-credits" && l.targetId === "keep" && l.value === result!.federalTaxCreditsApplied,
      ),
    ).toBe(true);
  });
});
