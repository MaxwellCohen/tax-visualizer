import { describe, expect, it } from "vitest";
import { FEDERAL_NIIT, TAX_DATA_BY_YEAR } from "~/lib/taxData.constants";

describe("taxData.constants", () => {
  it("exports NIIT rules", () => {
    expect(FEDERAL_NIIT.rate).toBeCloseTo(0.038, 6);
    expect(FEDERAL_NIIT.magiThreshold.single).toBe(200_000);
    expect(FEDERAL_NIIT.magiThreshold.marriedJoint).toBe(250_000);
  });

  it("defines modeled years with seven federal brackets each", () => {
    const statuses = ["single", "marriedJoint", "marriedSeparate", "headOfHousehold"] as const;
    for (const year of [2023, 2024, 2025, 2026]) {
      const cfg = TAX_DATA_BY_YEAR[year];
      expect(cfg).toBeDefined();
      for (const s of statuses) {
        expect(cfg.standardDeduction[s]).toBeGreaterThan(0);
        expect(cfg.federalBrackets[s]).toHaveLength(7);
        expect(cfg.longTermCapGains[s].zeroRateMax).toBeGreaterThan(0);
        expect(cfg.longTermCapGains[s].fifteenRateMax).toBeGreaterThan(cfg.longTermCapGains[s].zeroRateMax);
        expect(cfg.payroll.additionalMedicareThreshold[s]).toBeGreaterThan(0);
      }
      expect(cfg.payroll.socialSecurityWageBase).toBeGreaterThan(0);
      expect(cfg.pretaxLimits.electiveDeferral401k).toBeGreaterThan(0);
      expect(cfg.pretaxLimits.hsaSelfOnly).toBeGreaterThan(0);
      expect(cfg.pretaxLimits.hsaFamily).toBeGreaterThan(cfg.pretaxLimits.hsaSelfOnly);
      expect(cfg.status === "final" || cfg.status === "planning").toBe(true);
    }
  });

  it("2026 is planning; prior years are final", () => {
    expect(TAX_DATA_BY_YEAR[2026].status).toBe("planning");
    expect(TAX_DATA_BY_YEAR[2025].status).toBe("final");
  });
});
