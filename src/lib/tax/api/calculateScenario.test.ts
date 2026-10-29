import { describe, expect, it } from "vitest";
import { calculateScenario } from "~/lib/tax/api/calculateScenario";

describe("calculateScenario", () => {
  it("summarizes a single-filer W-2 scenario", () => {
    const result = calculateScenario({ year: 2026, filingStatus: "single", lineItems: { wages: 90_000 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const s = result.value;
    expect(s.grossIncome).toBe(90_000);
    expect(s.adjustedGrossIncome).toBe(90_000);
    expect(s.deduction).toEqual({ type: "standard", amount: 16_100 });
    expect(s.taxableIncome).toBe(73_900);
    expect(s.federalIncomeTax).toBe(10_970);
    expect(s.stateIncomeTax).toBe(0);
    expect(s.payrollTaxes).toEqual({ socialSecurity: 5_580, medicare: 1_305, selfEmployment: 0, total: 6_885 });
    expect(s.totalTax).toBe(17_855);
    expect(s.takeHomePay).toBe(72_145);
    expect(s.rates.federalMarginalRate).toBe(0.22);
    expect(s.rates.effectiveTotalTaxRate).toBeCloseTo(17_855 / 90_000, 4);
    expect(s.shareUrl).toBe("/?year=2026&filingStatus=single&wages=90000");
    expect(s.warnings).toEqual([]);
  });

  it("adds state income tax for a residence state", () => {
    const result = calculateScenario({ year: 2026, filingStatus: "single", state: "ca", lineItems: { wages: 90_000 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.input.state).toBe("CA");
    expect(result.value.stateIncomeTax).toBeGreaterThan(0);
    expect(result.value.rates.stateMarginalRate).toBe(0.093);
    expect(result.value.totalTax).toBeCloseTo(17_855 + result.value.stateIncomeTax, 2);
    expect(result.value.shareUrl).toContain("state=CA");
  });

  it("rejects invalid input with actionable messages", () => {
    const result = calculateScenario({
      year: 1999,
      filingStatus: "joint",
      state: "ZZ",
      lineItems: { wages: 1 },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join("\n")).toMatch(/year must be one of 2026, 2025, 2024, 2023/);
    expect(result.errors.join("\n")).toMatch(/filingStatus must be one of single, marriedJoint/);
    expect(result.errors.join("\n")).toMatch(/state must be "none" or a two-letter code/);
  });

  it("rejects unknown line items, negative amounts, and amounts over caps", () => {
    const result = calculateScenario({
      year: 2026,
      lineItems: { salary: 1, wages: -5, hsa: 1_000_000 },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const text = result.errors.join("\n");
    expect(text).toMatch(/Unknown line item id\(s\) for single: salary\. Valid ids: wages \(income-ordinary-wages-spouse1\)/);
    expect(text).toMatch(/lineItems\.wages: Cannot be negative/);
    expect(text).toMatch(/lineItems\.hsa: Cannot exceed/);
  });

  it("rejects non-object bodies", () => {
    expect(calculateScenario("nope")).toEqual({ ok: false, errors: ["Body must be a JSON object."] });
  });
});
