import { describe, expect, it } from "vitest";
import { aggregatePretaxFromSources } from "~/lib/taxCalc.pretaxBenefitSource";
import { clampTaxInputPretaxToLimits } from "~/lib/taxCalc.clamp";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";

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
});
