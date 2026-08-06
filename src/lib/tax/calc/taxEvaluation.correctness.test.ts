import { describe, expect, it } from "vitest";
import { evaluateTaxScenario } from "~/lib/tax/calc/taxEvaluation";
import { newIncomeSource } from "~/lib/tax/calc/labeledAmountSource";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import { incomeSourcesToRows, taxFormDataFromParts } from "~/lib/tax/form/factories";

const taxData2026 = () => {
  const taxData = getTaxYearConfig(2026);
  if (!taxData) throw new Error("missing 2026 tax config");
  return taxData;
};

describe("tax evaluation correctness fixes", () => {
  it("uses the SSA 2026 Social Security wage base of $184,500", () => {
    expect(taxData2026().payroll.socialSecurityWageBase).toBe(184_500);

    const form = taxFormDataFromParts({
      taxYear: 2026,
      filingStatus: "single",
      incomeRows: incomeSourcesToRows([
        newIncomeSource({ kind: "income-ordinary-wages", amount: 260_000, label: "Wages" }),
      ]),
      pretaxRows: [],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const ctx = evaluateTaxScenario(form.rows, taxData2026(), "single");
    // SS: 184500 * 0.062 = 11439; Medicare: 260000 * 0.0145 = 3770; Addl: 60000 * 0.009 = 540
    expect(ctx.payrollTaxBreakdown.socialSecurityTax).toBe(11_439);
    expect(ctx.payrollTax).toBe(11_439 + 3_770 + 540);
  });

  it("applies the standard deduction against LTCG-only income", () => {
    const form = taxFormDataFromParts({
      taxYear: 2026,
      filingStatus: "single",
      incomeRows: incomeSourcesToRows([
        newIncomeSource({
          kind: "income-longTermCapGains-longTermCapGains-spouse1",
          amount: 60_000,
          label: "Gains",
        }),
      ]),
      pretaxRows: [],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const ctx = evaluateTaxScenario(form.rows, taxData2026(), "single");
    // Taxable = 60000 - 16100 = 43900, all in 0% LTCG bracket
    expect(ctx.totalTaxableIncome).toBe(43_900);
    expect(ctx.taxableIncomeAfterDeductions).toBe(0);
    expect(ctx.federalIncomeTax).toBe(0);
  });

  it("deducts half of SE tax when computing federal income tax", () => {
    const form = taxFormDataFromParts({
      taxYear: 2026,
      filingStatus: "single",
      incomeRows: incomeSourcesToRows([
        newIncomeSource({
          kind: "income-ordinary-selfEmployment-selfEmployment-spouse1",
          amount: 50_000,
          label: "1099",
        }),
      ]),
      pretaxRows: [],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const ctx = evaluateTaxScenario(form.rows, taxData2026(), "single");
    const halfSe = ctx.selfEmploymentTax / 2;
    expect(ctx.selfEmploymentDeduction).toBe(halfSe);
    // Taxable ordinary = 50000 - halfSe - 16100
    expect(ctx.taxableIncomeAfterDeductions).toBeCloseTo(50_000 - halfSe - 16_100, 5);
    // 10% on 12400 + 12% on remainder
    const taxable = ctx.taxableIncomeAfterDeductions;
    const expectedFit = 12_400 * 0.1 + (taxable - 12_400) * 0.12;
    expect(ctx.federalIncomeTax).toBeCloseTo(expectedFit, 5);
  });
});
