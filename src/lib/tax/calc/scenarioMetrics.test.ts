import { describe, expect, it } from "vitest";
import { buildScenarioMetrics, scenarioMetricsToTaxCalculationInputs } from "~/lib/tax/calc/scenarioMetrics";
import type { TaxFormRow } from "~/lib/tax/form/types";

describe("buildScenarioMetrics", () => {
  it("normalizes settings, line items, and named metrics once", () => {
    const rows: TaxFormRow[] = [
      { type: "setting", id: "taxYear", value: 2026 },
      { type: "setting", id: "filingStatus", value: "marriedJoint" },
      { type: "setting", id: "useItemizedDeductions", value: true },
      { type: "setting", id: "qualifyingChildren", value: 2 },
      { type: "setting", id: "otherDependents", value: 1 },
      { type: "income", id: "w1", kind: "income-ordinary-wages-spouse1", label: "Wages 1", amount: 100_000 },
      { type: "income", id: "w2", kind: "income-ordinary-wages-spouse2", label: "Wages 2", amount: 50_000 },
      { type: "income", id: "ltcg", kind: "income-longTermCapGains", label: "LTCG", amount: 10_000 },
      { type: "pretax", id: "k", kind: "input-pretax-401K-preTax401kSpouse1", label: "401k", amount: 10_000 },
      { type: "pretax", id: "h", kind: "input-pretax-hsa-preTaxHsaSpouse1", label: "HSA", amount: 3_000 },
      { type: "deduction", id: "d", kind: "deduction-charitable", label: "Charity", amount: 5_000 },
      { type: "credit", id: "c", kind: "input-credit-other-otherFederalCredit", label: "Credit", amount: 700 },
    ];

    const metrics = buildScenarioMetrics(rows);
    expect(metrics.taxYear).toBe(2026);
    expect(metrics.filingStatus).toBe("marriedJoint");
    expect(metrics.useItemizedDeductions).toBe(true);
    expect(metrics.income.wagesSpouse1).toBe(100_000);
    expect(metrics.income.wagesSpouse2).toBe(50_000);
    expect(metrics.income.total).toBe(160_000);
    expect(metrics.pretax.all).toBe(13_000);
    expect(metrics.pretax.electiveDeferrals401kFamilyExcludingCatchUp).toBe(10_000);
    expect(metrics.deductions.totalItemized).toBe(5_000);
    expect(metrics.credits.other).toBe(700);

    expect(scenarioMetricsToTaxCalculationInputs(metrics)).toMatchObject({
      taxYear: 2026,
      filingStatus: "marriedJoint",
      qualifyingChildren: 2,
      otherDependents: 1,
      useItemizedDeductions: true,
    });
  });

  it("allows deductible IRA against self-employment and zeros payroll pretax without wages", () => {
    const rows: TaxFormRow[] = [
      { type: "setting", id: "taxYear", value: 2026 },
      { type: "setting", id: "filingStatus", value: "single" },
      {
        type: "income",
        id: "se",
        kind: "income-ordinary-selfEmployment-selfEmployment-spouse1",
        label: "1099",
        amount: 50_000,
      },
      {
        type: "pretax",
        id: "k",
        kind: "input-pretax-401K-preTax401kSpouse1",
        label: "401k",
        amount: 10_000,
      },
      {
        type: "pretax",
        id: "ira",
        kind: "input-pretax-traditionalIra-traditionalIraSpouse1",
        label: "IRA",
        amount: 7_000,
      },
    ];
    const metrics = buildScenarioMetrics(rows);
    expect(metrics.pretax.traditionalIra).toBe(7_000);
    expect(metrics.pretax.preTax401k).toBe(0);
    expect(metrics.pretax.all).toBe(7_000);
  });

  it("caps combined HSA rows to the 2026 family limit", () => {
    const rows: TaxFormRow[] = [
      { type: "setting", id: "taxYear", value: 2026 },
      { type: "setting", id: "filingStatus", value: "marriedJoint" },
      { type: "income", id: "w1", kind: "income-ordinary-wages-spouse1", label: "Wages 1", amount: 100_000 },
      { type: "income", id: "w2", kind: "income-ordinary-wages-spouse2", label: "Wages 2", amount: 100_000 },
      { type: "pretax", id: "h1", kind: "input-pretax-hsa-preTaxHsaSpouse1", label: "HSA 1", amount: 8_750 },
      { type: "pretax", id: "h2", kind: "input-pretax-hsa-preTaxHsaSpouse2", label: "HSA 2", amount: 8_750 },
    ];
    expect(buildScenarioMetrics(rows).pretax.hsa).toBe(8_750);
  });
});
