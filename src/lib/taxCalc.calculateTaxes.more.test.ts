import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource } from "~/lib/taxCalc";
import { baseInput } from "~/lib/taxCalc.test.helpers";

describe("calculateTaxes more", () => {
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
