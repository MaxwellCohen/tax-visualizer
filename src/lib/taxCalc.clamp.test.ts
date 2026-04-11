import { describe, expect, it } from "vitest";
import { clampTaxInputPretaxToLimits } from "~/lib/taxCalc.clamp";
import { baseInput } from "~/lib/taxCalc.test.helpers";

describe("clampTaxInputPretaxToLimits", () => {
  it("returns input unchanged for unknown tax year", () => {
    const input = baseInput({ taxYear: 1900, preTax401kSpouse1: 999_999 });
    expect(clampTaxInputPretaxToLimits(input)).toBe(input);
  });

  it("clamps 401(k) and HSA for single", () => {
    const out = clampTaxInputPretaxToLimits(
      baseInput({
        preTax401kSpouse1: 999_999,
        preTaxHsaSpouse1: 999_999,
        traditionalIraSpouse1: 999_999,
      }),
    );
    expect(out.preTax401kSpouse1).toBe(23_500);
    expect(out.preTaxHsaSpouse1).toBe(4_300);
    expect(out.traditionalIraSpouse1).toBe(7_000);
    expect(out.preTax401kSpouse2).toBe(0);
    expect(out.preTaxHsaSpouse2).toBe(0);
  });

  it("clamps per-spouse limits for married joint", () => {
    const out = clampTaxInputPretaxToLimits(
      baseInput({
        filingStatus: "marriedJoint",
        preTax401kSpouse1: 30_000,
        preTax401kSpouse2: 30_000,
        preTaxHsaSpouse1: 10_000,
        preTaxHsaSpouse2: 10_000,
        traditionalIraSpouse1: 10_000,
        traditionalIraSpouse2: 10_000,
      }),
    );
    expect(out.preTax401kSpouse1).toBe(23_500);
    expect(out.preTax401kSpouse2).toBe(23_500);
    expect(out.preTaxHsaSpouse1 + out.preTaxHsaSpouse2).toBeLessThanOrEqual(8_550);
    expect(out.traditionalIraSpouse1).toBe(7_000);
    expect(out.traditionalIraSpouse2).toBe(7_000);
  });
});
