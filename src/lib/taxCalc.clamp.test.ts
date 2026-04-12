import { describe, expect, it } from "vitest";
import { aggregatePretaxFromSources, newPretaxBenefitSource } from "~/lib/taxCalc.pretaxBenefitSource";
import { newItemizedDeductionSource } from "~/lib/taxCalc";
import { clampTaxInputPretaxToLimits, clampTaxInputToYearLimits } from "~/lib/taxCalc.clamp";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { newFederalTaxCreditSource } from "~/lib/taxCalc.federalTaxCreditSource";

function agg(
  input: ReturnType<typeof baseInput>,
  joint: boolean,
) {
  return aggregatePretaxFromSources(input.pretaxBenefitSources, joint);
}

describe("clampTaxInputPretaxToLimits", () => {
  it("returns input unchanged for unknown tax year", () => {
    const input = baseInput({
      taxYear: 1900,
      pretaxBenefitSources: withPretaxTotals({ preTax401kSpouse1: 999_999 }),
    });
    expect(clampTaxInputPretaxToLimits(input)).toBe(input);
  });

  it("clamps 401(k) and HSA for single", () => {
    const out = clampTaxInputPretaxToLimits(
      baseInput({
        pretaxBenefitSources: withPretaxTotals({
          preTax401kSpouse1: 999_999,
          preTaxHsaSpouse1: 999_999,
          traditionalIraSpouse1: 999_999,
        }),
      }),
    );
    const p = agg(out, false);
    expect(p.preTax401kSpouse1).toBe(23_500);
    expect(p.preTaxHsaSpouse1).toBe(4_300);
    expect(p.traditionalIraSpouse1).toBe(7_000);
    expect(p.preTax401kSpouse2).toBe(0);
    expect(p.preTaxHsaSpouse2).toBe(0);
  });

  it("clamps per-spouse limits for married joint", () => {
    const out = clampTaxInputPretaxToLimits(
      baseInput({
        filingStatus: "marriedJoint",
        pretaxBenefitSources: withPretaxTotals({
          preTax401kSpouse1: 30_000,
          preTax401kSpouse2: 30_000,
          preTaxHsaSpouse1: 10_000,
          preTaxHsaSpouse2: 10_000,
          traditionalIraSpouse1: 10_000,
          traditionalIraSpouse2: 10_000,
        }),
      }),
    );
    const p = agg(out, true);
    expect(p.preTax401kSpouse1).toBe(23_500);
    expect(p.preTax401kSpouse2).toBe(23_500);
    expect(p.preTaxHsaSpouse1 + p.preTaxHsaSpouse2).toBeLessThanOrEqual(8_550);
    expect(p.traditionalIraSpouse1).toBe(7_000);
    expect(p.traditionalIraSpouse2).toBe(7_000);
  });

  it("combines 401(k) and 403(b) rows for the same elective deferral cap", () => {
    const out = clampTaxInputPretaxToLimits(
      baseInput({
        pretaxBenefitSources: [
          newPretaxBenefitSource({ kind: "preTax401kSpouse1", amount: 20_000 }),
          newPretaxBenefitSource({ kind: "preTax403bSpouse1", amount: 10_000 }),
        ],
      }),
    );
    const p = agg(out, false);
    expect(p.preTax401kSpouse1).toBe(23_500);
  });
});

describe("clampTaxInputToYearLimits (SALT + federal credits)", () => {
  it("scales SALT rows down to the modeled SALT cap", () => {
    const out = clampTaxInputToYearLimits(
      baseInput({
        useItemizedDeductions: true,
        filingStatus: "single",
        itemizedDeductions: [
          newItemizedDeductionSource({ kind: "salt", amount: 8_000 }),
          newItemizedDeductionSource({ kind: "salt", amount: 5_000 }),
        ],
      }),
    );
    const salt = out.itemizedDeductions.filter(r => r.kind === "salt");
    expect(salt.reduce((a, r) => a + r.amount, 0)).toBe(10_000);
  });

  it("scales federal credit rows per kind to yearly caps", () => {
    const out = clampTaxInputToYearLimits(
      baseInput({
        federalTaxCredits: [
          newFederalTaxCreditSource({ kind: "childTaxCredit", amount: 30_000 }),
          newFederalTaxCreditSource({ kind: "childTaxCredit", amount: 30_000 }),
        ],
      }),
    );
    const ctc = out.federalTaxCredits.filter(r => r.kind === "childTaxCredit");
    expect(ctc.reduce((a, r) => a + r.amount, 0)).toBe(40_000);
  });
});
