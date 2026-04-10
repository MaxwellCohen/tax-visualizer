import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource, type TaxInput } from "~/lib/taxCalc";

function baseInput(overrides: Partial<TaxInput> = {}): TaxInput {
  return {
    taxYear: 2025,
    filingStatus: "single",
    incomeSources: [newIncomeSource({ kind: "wages", amount: 50_000 })],
    preTax401kSpouse1: 0,
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
    useItemizedDeductions: false,
    itemizedDeductions: 0,
    ...overrides,
  };
}

describe("calculateTaxes", () => {
  it("returns null for unknown tax year", () => {
    expect(calculateTaxes(baseInput({ taxYear: 1999 }))).toBeNull();
  });

  it("2025 single: ordinary income tax matches bracket walk (no pretax, no gains)", () => {
    const r = calculateTaxes(baseInput());
    expect(r).not.toBeNull();
    expect(r!.ordinaryTaxableIncome).toBe(34_250);
    const expectedOrdinary =
      11_925 * 0.1 + (34_250 - 11_925) * 0.12;
    expect(r!.federalOrdinaryIncomeTax).toBeCloseTo(expectedOrdinary, 5);
    expect(r!.federalLongTermCapGainsTax).toBe(0);
    expect(r!.federalNetInvestmentIncomeTax).toBe(0);
    expect(r!.federalIncomeTax).toBeCloseTo(expectedOrdinary, 5);
  });

  it("2025 single: payroll tax on full wages when no pretax", () => {
    const r = calculateTaxes(baseInput());
    expect(r!.socialSecurityTax).toBeCloseTo(50_000 * 0.062, 5);
    expect(r!.medicareTax).toBeCloseTo(50_000 * 0.0145, 5);
    expect(r!.payrollTax).toBeCloseTo(r!.socialSecurityTax + r!.medicareTax, 5);
  });

  it("traditional 401(k) reduces ordinary taxable income and Social Security / Medicare base", () => {
    const r = calculateTaxes(baseInput({ preTax401kSpouse1: 10_000 }));
    expect(r!.preTax401k).toBe(10_000);
    expect(r!.wagesAfterPretax).toBe(40_000);
    expect(r!.ordinaryTaxableIncome).toBe(40_000 - 15_750);
    expect(r!.socialSecurityTax).toBeCloseTo(40_000 * 0.062, 5);
    expect(r!.medicareTax).toBeCloseTo(40_000 * 0.0145, 5);
  });

  it("HSA payroll reduces FICA base like 401(k)", () => {
    const r = calculateTaxes(
      baseInput({ preTaxHsaSpouse1: 3_000, preTax401kSpouse1: 0 }),
    );
    expect(r!.preTaxHsa).toBe(3_000);
    const wagesForFica = 47_000;
    expect(r!.socialSecurityTax).toBeCloseTo(wagesForFica * 0.062, 5);
    expect(r!.medicareTax).toBeCloseTo(wagesForFica * 0.0145, 5);
  });

  it("Social Security tax stops at 2025 wage base", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [newIncomeSource({ kind: "wages", amount: 200_000 })],
      }),
    );
    expect(r!.socialSecurityTax).toBeCloseTo(176_100 * 0.062, 5);
  });

  it("Additional Medicare applies above $200k single (wages only)", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [newIncomeSource({ kind: "wages", amount: 220_000 })],
      }),
    );
    const baseMed = 220_000 * 0.0145;
    const addl = (220_000 - 200_000) * 0.009;
    expect(r!.medicareTax).toBeCloseTo(baseMed + addl, 5);
  });

  it("LTCG: 0% on gains that fit under zero-rate band after ordinary taxable", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 30_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 10_000 }),
        ],
      }),
    );
    expect(r!.ordinaryTaxableIncome).toBe(30_000 - 15_750);
    expect(r!.longTermTaxableIncome).toBe(10_000);
    expect(r!.federalLongTermCapGainsTax).toBe(0);
  });

  it("LTCG: 15% when ordinary taxable is above zero-rate band", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 100_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 10_000 }),
        ],
      }),
    );
    expect(r!.ordinaryTaxableIncome).toBe(100_000 - 15_750);
    expect(r!.federalLongTermCapGainsTax).toBeCloseTo(10_000 * 0.15, 5);
  });

  it("NIIT: 3.8% × min(NII, MAGI − threshold) for single", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 220_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 50_000 }),
        ],
      }),
    );
    expect(r!.netInvestmentIncome).toBe(50_000);
    expect(r!.federalNetInvestmentIncomeTax).toBeCloseTo(0.038 * 50_000, 5);
  });

  it("NIIT uses overlap when MAGI over threshold is smaller than NII", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 170_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 100_000 }),
        ],
      }),
    );
    expect(r!.federalNetInvestmentIncomeTax).toBeCloseTo(0.038 * 70_000, 5);
  });

  it("standard deduction applies to ordinary income first, then long-term gains", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 5_000 }),
          newIncomeSource({ kind: "longTermCapGains", amount: 50_000 }),
        ],
      }),
    );
    expect(r!.ordinaryTaxableIncome).toBe(0);
    const remainingDed = 15_750 - 5_000;
    expect(r!.longTermTaxableIncome).toBe(50_000 - remainingDed);
    expect(r!.longTermTaxableIncome).toBe(39_250);
  });

  it("short-term capital gains taxed as ordinary income", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "wages", amount: 0 }),
          newIncomeSource({ kind: "shortTermCapGains", amount: 50_000 }),
        ],
      }),
    );
    expect(r!.ordinaryTaxableIncome).toBe(50_000 - 15_750);
    expect(r!.federalLongTermCapGainsTax).toBe(0);
    expect(r!.payrollTax).toBe(0);
  });

  it("deductible traditional IRA reduces ordinary income (not payroll)", () => {
    const r = calculateTaxes(
      baseInput({ traditionalIraSpouse1: 7_000 }),
    );
    expect(r!.traditionalIra).toBe(7_000);
    expect(r!.ordinaryTaxableIncome).toBe(50_000 - 7_000 - 15_750);
    expect(r!.socialSecurityTax).toBeCloseTo(50_000 * 0.062, 5);
    expect(r!.takeHomePay).toBeCloseTo(
      50_000 - r!.federalIncomeTax - r!.payrollTax - 7_000,
      5,
    );
  });

  it("single filer HSA capped at self-only limit in calculation", () => {
    const r = calculateTaxes(
      baseInput({ preTaxHsaSpouse1: 50_000 }),
    );
    expect(r!.preTaxHsa).toBe(4_300);
  });

  it("married joint: combined HSA capped at family limit", () => {
    const r = calculateTaxes(
      baseInput({
        filingStatus: "marriedJoint",
        preTaxHsaSpouse1: 5_000,
        preTaxHsaSpouse2: 5_000,
      }),
    );
    expect(r!.preTaxHsa).toBe(8_550);
  });
});
