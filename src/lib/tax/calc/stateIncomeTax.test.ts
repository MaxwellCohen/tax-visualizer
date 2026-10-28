import { describe, expect, it } from "vitest";
import { getStateYearValues } from "~/lib/config/states/index";
import { STATE_CODES } from "~/lib/config/states/types";
import { calculateStateIncomeTax } from "~/lib/tax/calc/stateIncomeTax";
import { getAvailableTaxYears } from "~/lib/tax/data/accessors.impl";

const base = {
  taxYear: 2026,
  filingStatus: "single" as const,
  dependents: 0,
  federalStandardDeduction: 16100,
  federalDeductionClaimed: 16100,
  federalIncomeTax: 0,
};

describe("calculateStateIncomeTax", () => {
  it("runs California brackets on AGI after the standard deduction, then the exemption credit", () => {
    const result = calculateStateIncomeTax({ ...base, residenceState: "CA", federalAgi: 100_000 });
    expect(result.taxableIncome).toBe(94_460);
    // 1% / 2% / 4% / 6% / 8% bands filled, 9.3% on the rest, less the $153 exemption credit.
    const expected =
      11_079 * 0.01 +
      (26_264 - 11_079) * 0.02 +
      (41_452 - 26_264) * 0.04 +
      (57_542 - 41_452) * 0.06 +
      (72_724 - 57_542) * 0.08 +
      (94_460 - 72_724) * 0.093 -
      153;
    expect(result.tax).toBeCloseTo(expected, 6);
    expect(result.marginalRate).toBe(0.093);
  });

  it("charges nothing in a state without an income tax", () => {
    const result = calculateStateIncomeTax({ ...base, residenceState: "TX", federalAgi: 250_000 });
    expect(result).toMatchObject({ modeled: true, taxableIncome: 0, tax: 0 });
  });

  it("charges nothing when no state is selected", () => {
    expect(calculateStateIncomeTax({ ...base, residenceState: "none", federalAgi: 250_000 }).tax).toBe(0);
  });

  it("uses the federal standard deduction for the filing status in conforming states", () => {
    const result = calculateStateIncomeTax({
      ...base,
      taxYear: 2025,
      filingStatus: "marriedJoint",
      residenceState: "CO",
      federalAgi: 100_000,
      federalStandardDeduction: 31_500,
    });
    expect(result.standardDeduction).toBe(31_500);
    expect(result.tax).toBeCloseTo((100_000 - 31_500) * 0.044, 6);
  });

  it("subtracts federal income tax where the state allows it (Alabama, uncapped)", () => {
    const result = calculateStateIncomeTax({
      ...base,
      residenceState: "AL",
      federalAgi: 50_000,
      federalIncomeTax: 4_000,
    });
    expect(result.taxableIncome).toBe(50_000 - 3_000 - 1_500 - 4_000);
    expect(result.tax).toBeCloseTo(500 * 0.02 + 2_500 * 0.04 + (41_500 - 3_000) * 0.05, 6);
  });

  it("caps the federal income tax deduction (Missouri)", () => {
    const result = calculateStateIncomeTax({
      ...base,
      residenceState: "MO",
      federalAgi: 200_000,
      federalIncomeTax: 40_000,
    });
    expect(result.federalIncomeTaxDeduction).toBe(5_000);
  });

  it("applies per-dependent exemptions", () => {
    const withKids = calculateStateIncomeTax({ ...base, residenceState: "IL", federalAgi: 80_000, dependents: 2 });
    expect(withKids.exemptions).toBe(2_925 * 3);
    expect(withKids.tax).toBeCloseTo((80_000 - 2_925 * 3) * 0.0495, 6);
  });

  it("gives Utah's 6% credit on the federal deduction claimed, without its phaseout", () => {
    const result = calculateStateIncomeTax({ ...base, residenceState: "UT", federalAgi: 60_000 });
    expect(result.tax).toBeCloseTo(60_000 * 0.0445 - 0.06 * 16_100, 6);
  });

  it("leaves income below the first threshold untaxed (Ohio)", () => {
    const result = calculateStateIncomeTax({ ...base, residenceState: "OH", federalAgi: 30_000 });
    expect(result.tax).toBeCloseTo((30_000 - 2_400 - 26_050) * 0.0275, 6);
  });

  it("never lets exemption credits push tax below zero", () => {
    const result = calculateStateIncomeTax({ ...base, residenceState: "CA", federalAgi: 6_000 });
    expect(result.tax).toBe(0);
    expect(result.creditsApplied).toBe(result.taxBeforeCredits);
  });

  it("reports unmodeled years instead of guessing", () => {
    const result = calculateStateIncomeTax({ ...base, taxYear: 2019, residenceState: "CA", federalAgi: 100_000 });
    expect(result).toMatchObject({ modeled: false, tax: 0 });
  });
});

describe("state year values", () => {
  it("cover every state and DC for every federal tax year", () => {
    for (const year of getAvailableTaxYears()) {
      const values = getStateYearValues(year);
      expect(values, String(year)).toBeDefined();
      expect(Object.keys(values!).sort()).toEqual([...STATE_CODES].sort());
    }
  });

  it("have ascending thresholds and plausible rates", () => {
    for (const year of getAvailableTaxYears()) {
      for (const [code, entry] of Object.entries(getStateYearValues(year)!)) {
        if (!entry) continue;
        const schedules = "single" in entry.brackets ? [entry.brackets.single, entry.brackets.joint] : [entry.brackets];
        for (const schedule of schedules) {
          expect(schedule.length, `${year} ${code}`).toBeGreaterThan(0);
          for (let i = 0; i < schedule.length; i++) {
            const [over, rate] = schedule[i];
            expect(rate, `${year} ${code}`).toBeGreaterThanOrEqual(0);
            expect(rate, `${year} ${code}`).toBeLessThan(0.15);
            if (i > 0) expect(over, `${year} ${code}`).toBeGreaterThan(schedule[i - 1][0]);
          }
        }
      }
    }
  });
});
