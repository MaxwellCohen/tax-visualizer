import { describe, expect, it } from "vitest";
import {
  getAvailableTaxYears,
  getFederalTaxCreditCaps,
  getItemizedDeductionCaps,
  getPretaxLimits,
  getTaxYearConfig,
  isPlanningTaxYear,
} from "~/lib/taxData.accessors";

describe("taxData accessors", () => {
  it("lists tax years newest-first", () => {
    const years = getAvailableTaxYears();
    expect(years.length).toBeGreaterThan(0);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it("returns config for modeled years and null otherwise", () => {
    expect(getTaxYearConfig(2025)).not.toBeNull();
    expect(getTaxYearConfig(1900)).toBeNull();
  });

  it("isPlanningTaxYear follows config status", () => {
    const y = getAvailableTaxYears()[0];
    const cfg = getTaxYearConfig(y);
    expect(isPlanningTaxYear(y)).toBe(cfg?.status === "planning");
    expect(isPlanningTaxYear(1900)).toBe(false);
  });

  it("getPretaxLimits mirrors config pretaxLimits", () => {
    const y = 2025;
    const cfg = getTaxYearConfig(y);
    expect(getPretaxLimits(y)).toEqual(cfg?.pretaxLimits ?? null);
    expect(getPretaxLimits(1900)).toBeNull();
  });

  it("getItemizedDeductionCaps and getFederalTaxCreditCaps mirror config", () => {
    const y = 2025;
    const cfg = getTaxYearConfig(y);
    expect(getItemizedDeductionCaps(y)).toEqual(cfg?.itemizedCaps ?? null);
    expect(getFederalTaxCreditCaps(y)).toEqual(cfg?.federalTaxCreditCaps ?? null);
    expect(getItemizedDeductionCaps(1900)).toBeNull();
    expect(getFederalTaxCreditCaps(1900)).toBeNull();
  });
});
