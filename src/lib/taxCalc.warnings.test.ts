import { describe, expect, it } from "vitest";
import { buildTaxWarnings, type TaxWarningContext } from "~/lib/taxCalc.warnings";
import { baseInput, withItemizedTotal } from "~/lib/taxCalc.test.helpers";

function ctx(partial: Partial<TaxWarningContext>): TaxWarningContext {
  return {
    input: baseInput(),
    rawPretaxTotal: 0,
    wageIncome: 50_000,
    pretaxCapped401: false,
    pretaxCappedHsa: false,
    pretaxCappedIra: false,
    iraCappedByCompensation: false,
    cap401: 23_500,
    joint: false,
    limHsaFamily: 8_550,
    limHsaSelfOnly: 4_300,
    capIra: 7_000,
    standardDeduction: 15_750,
    itemizedDeductions: 0,
    longTermCapitalGainsGrossIncome: 0,
    federalNetInvestmentIncomeTax: 0,
    federalIncomeTaxBeforeCredits: 0,
    federalTaxCreditsEntered: 0,
    ...partial,
  };
}

describe("buildTaxWarnings", () => {
  it("warns when pre-tax entries exist but no wages", () => {
    const w = ctx({ rawPretaxTotal: 1_000, wageIncome: 0 });
    expect(buildTaxWarnings(w).some(m => m.includes("only apply to W-2 wages"))).toBe(true);
  });

  it("warns when pre-tax exceeds wages", () => {
    const w = ctx({ rawPretaxTotal: 60_000, wageIncome: 50_000 });
    expect(buildTaxWarnings(w).some(m => m.includes("scaled those entries"))).toBe(true);
  });

  it("warns for 401 cap only", () => {
    const w = ctx({ pretaxCapped401: true });
    expect(buildTaxWarnings(w).some(m => m.includes("401(k) deferrals were capped"))).toBe(true);
  });

  it("warns for HSA cap only (single)", () => {
    const w = ctx({ pretaxCappedHsa: true, joint: false });
    expect(buildTaxWarnings(w).some(m => m.includes("HSA payroll amounts were capped"))).toBe(true);
  });

  it("warns for both 401 and HSA caps (joint)", () => {
    const w = ctx({ pretaxCapped401: true, pretaxCappedHsa: true, joint: true });
    const m = buildTaxWarnings(w).join("\n");
    expect(m).toContain("401(k) deferrals and HSA");
    expect(m).toContain("family HDHP");
  });

  it("warns for traditional IRA cap", () => {
    const w = ctx({ pretaxCappedIra: true });
    expect(buildTaxWarnings(w).some(m => m.includes("Traditional IRA amounts were capped"))).toBe(true);
  });

  it("warns when IRA deduction limited by compensation", () => {
    const w = ctx({ iraCappedByCompensation: true });
    expect(buildTaxWarnings(w).some(m => m.includes("limited to modeled ordinary income"))).toBe(true);
  });

  it("warns when itemized is below standard", () => {
    const w = ctx({
      input: baseInput({ useItemizedDeductions: true, itemizedDeductions: withItemizedTotal(5_000) }),
      itemizedDeductions: 5_000,
    });
    expect(buildTaxWarnings(w).some(m => m.includes("below the"))).toBe(true);
  });

  it("warns on long-term gains present", () => {
    const w = ctx({ longTermCapitalGainsGrossIncome: 100 });
    expect(buildTaxWarnings(w).some(m => m.includes("Long-term capital gains"))).toBe(true);
  });

  it("warns when NIIT is positive", () => {
    const w = ctx({ federalNetInvestmentIncomeTax: 50 });
    expect(buildTaxWarnings(w).some(m => m.includes("Net investment income tax"))).toBe(true);
  });

  it("warns when federal credits exceed modeled liability", () => {
    const w = ctx({
      federalIncomeTaxBeforeCredits: 5_000,
      federalTaxCreditsEntered: 8_000,
    });
    expect(buildTaxWarnings(w).some(m => m.includes("exceed modeled federal income tax"))).toBe(true);
  });

  it("returns empty when nothing applies", () => {
    expect(buildTaxWarnings(ctx({}))).toEqual([]);
  });
});
