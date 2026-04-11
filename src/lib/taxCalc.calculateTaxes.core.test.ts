import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource } from "~/lib/taxCalc";
import { baseInput } from "~/lib/taxCalc.test.helpers";

describe("calculateTaxes core", () => {
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
});
