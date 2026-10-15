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

  it("uses 2026 elective deferral, IRA, and HSA limits", () => {
    const limits = taxData2026().pretaxLimits;
    expect(limits.electiveDeferral401k).toBe(24_500);
    expect(limits.electiveDeferral401kCatchUp).toBe(8_000);
    expect(limits.traditionalIraContribution).toBe(7_500);
    expect(limits.hsaSelfOnly).toBe(4_400);
    expect(limits.hsaFamily).toBe(8_750);
  });

  it("computes self-employment Social Security separately per spouse", () => {
    const form = taxFormDataFromParts({
      taxYear: 2026,
      filingStatus: "marriedJoint",
      incomeRows: incomeSourcesToRows([
        newIncomeSource({
          kind: "income-ordinary-selfEmployment-selfEmployment-spouse1",
          amount: 200_000,
          label: "SE 1",
        }),
        newIncomeSource({
          kind: "income-ordinary-selfEmployment-selfEmployment-spouse2",
          amount: 200_000,
          label: "SE 2",
        }),
      ]),
      pretaxRows: [],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const taxData = taxData2026();
    const ctx = evaluateTaxScenario(form.rows, taxData, "marriedJoint");
    const net = 200_000 * taxData.payroll.selfEmploymentNetEarningsFactor;
    const ss = Math.min(net, taxData.payroll.socialSecurityWageBase) * taxData.payroll.selfEmploymentSocialSecurityRate;
    const medicare = net * taxData.payroll.selfEmploymentMedicareRate;
    expect(ctx.selfEmploymentTax).toBeCloseTo(2 * (ss + medicare), 5);
  });

  it("applies excess itemized deductions against LTCG after ordinary income is exhausted", () => {
    const form = taxFormDataFromParts({
      taxYear: 2026,
      filingStatus: "single",
      incomeRows: incomeSourcesToRows([
        newIncomeSource({ kind: "income-ordinary-wages", amount: 80_000, label: "Wages" }),
        newIncomeSource({
          kind: "income-longTermCapGains-longTermCapGains-spouse1",
          amount: 20_000,
          label: "Gains",
        }),
      ]),
      pretaxRows: [],
      useItemizedDeductions: true,
      deductionRows: [
        {
          type: "deduction",
          id: "d1",
          kind: "deduction-charitable",
          label: "Charity",
          amount: 90_000,
        },
      ],
      creditRows: [],
    });
    const ctx = evaluateTaxScenario(form.rows, taxData2026(), "single");
    expect(ctx.taxableIncomeAfterDeductions).toBe(0);
    expect(ctx.ltcgTaxableIncome).toBe(10_000);
    expect(ctx.totalTaxableIncome).toBe(10_000);
  });

  it("lets deductible IRA reduce self-employment income without W-2 wages", () => {
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
      pretaxRows: [
        {
          type: "pretax",
          id: "ira",
          kind: "input-pretax-traditionalIra-traditionalIraSpouse1",
          label: "IRA",
          amount: 7_000,
        },
      ],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const ctx = evaluateTaxScenario(form.rows, taxData2026(), "single");
    expect(ctx.metrics.pretax.traditionalIra).toBe(7_000);
    expect(ctx.ordinaryIncomeAfterPretax).toBe(43_000);
  });

  it("caps household HSA contributions to the family limit without clamp()", () => {
    const form = taxFormDataFromParts({
      taxYear: 2026,
      filingStatus: "marriedJoint",
      incomeRows: incomeSourcesToRows([
        newIncomeSource({ kind: "income-ordinary-wages-spouse1", amount: 100_000, label: "Wages 1" }),
        newIncomeSource({ kind: "income-ordinary-wages-spouse2", amount: 100_000, label: "Wages 2" }),
      ]),
      pretaxRows: [
        {
          type: "pretax",
          id: "h1",
          kind: "input-pretax-hsa-preTaxHsaSpouse1",
          label: "HSA 1",
          amount: 8_750,
        },
        {
          type: "pretax",
          id: "h2",
          kind: "input-pretax-hsa-preTaxHsaSpouse2",
          label: "HSA 2",
          amount: 8_750,
        },
      ],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const ctx = evaluateTaxScenario(form.rows, taxData2026(), "marriedJoint");
    expect(ctx.metrics.pretax.hsa).toBe(8_750);
  });
});
