import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource } from "~/lib/taxCalc";
import { aggregatePretaxFromSources } from "~/lib/taxCalc.pretaxBenefitSource";
import { sumLabeledAmountSources } from "~/lib/taxCalc.labeledAmountSource";
import { baseInput, withFederalCreditsTotal, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import {
  buildScenarioSummaryText,
  deserializeScenarioInput,
  getScenarioPresets,
  sanitizeScenarioInput,
  serializeScenarioInput,
} from "~/lib/taxScenario";
import {
  fallbackScenario,
  normalizeTaxYear,
  sanitizeFilingStatus,
  sanitizeIncomeKind,
  sanitizeFederalTaxCreditKind,
  sanitizeItemizedDeductionKind,
  sanitizeMoney,
} from "~/lib/taxScenario.sanitizeHelpers";

describe("taxScenario sanitize helpers", () => {
  it("sanitizeMoney", () => {
    expect(sanitizeMoney(-1)).toBe(0);
    expect(sanitizeMoney(NaN)).toBe(0);
    expect(sanitizeMoney("12")).toBe(12);
  });

  it("sanitizeIncomeKind", () => {
    expect(sanitizeIncomeKind("wages")).toBe("wages");
    expect(sanitizeIncomeKind("bogus")).toBe("ordinary");
  });

  it("sanitizeFilingStatus", () => {
    expect(sanitizeFilingStatus("marriedJoint")).toBe("marriedJoint");
    expect(sanitizeFilingStatus("nope")).toBe("single");
  });

  it("sanitizeItemizedDeductionKind", () => {
    expect(sanitizeItemizedDeductionKind("salt")).toBe("salt");
    expect(sanitizeItemizedDeductionKind("bogus")).toBe("otherItemized");
  });

  it("sanitizeFederalTaxCreditKind", () => {
    expect(sanitizeFederalTaxCreditKind("childTaxCredit")).toBe("childTaxCredit");
    expect(sanitizeFederalTaxCreditKind("bogus")).toBe("otherFederalCredit");
  });

  it("normalizeTaxYear", () => {
    expect(normalizeTaxYear(2025, [2024, 2025], 2024)).toBe(2025);
    expect(normalizeTaxYear(1999, [2024, 2025], 2024)).toBe(2024);
  });

  it("fallbackScenario", () => {
    const s = fallbackScenario(2025);
    expect(s.taxYear).toBe(2025);
    expect(s.incomeSources.length).toBeGreaterThan(0);
  });
});

describe("sanitizeScenarioInput", () => {
  const years = [2024, 2025];
  const fallback = 2025;

  it("falls back for non-object input", () => {
    const s = sanitizeScenarioInput(null, years, fallback);
    expect(s.taxYear).toBe(fallback);
  });

  it("maps v4 payload and clamps pretax", () => {
    const raw = {
      version: 4 as const,
      taxYear: 2025,
      filingStatus: "single" as const,
      incomeSources: [{ id: "a", kind: "wages" as const, label: "x", amount: 10_000 }],
      pretaxBenefitSources: [
        { kind: "preTax401kSpouse1", label: "", amount: 999_999 },
      ],
      useItemizedDeductions: false,
      itemizedDeductions: [{ kind: "otherItemized", label: "", amount: 0 }],
      federalTaxCredits: [{ kind: "otherFederalCredit", label: "", amount: 0 }],
    };
    const s = sanitizeScenarioInput(raw, years, fallback);
    expect(aggregatePretaxFromSources(s.pretaxBenefitSources, false).preTax401kSpouse1).toBe(23_500);
  });

  it("maps v4 pretax and itemized rows", () => {
    const raw = {
      version: 4 as const,
      taxYear: 2025,
      filingStatus: "single" as const,
      incomeSources: [{ id: "a", kind: "wages" as const, label: "", amount: 50_000 }],
      pretaxBenefitSources: [
        { kind: "preTax401kSpouse1", label: "", amount: 5_000 },
        { kind: "preTaxHsaSpouse1", label: "", amount: 1_000 },
        { kind: "preTaxOther", label: "", amount: 2 },
      ],
      useItemizedDeductions: true,
      itemizedDeductions: [{ kind: "charitable", label: "", amount: 20_000 }],
      federalTaxCredits: [{ kind: "otherFederalCredit", label: "", amount: 0 }],
    };
    const s = sanitizeScenarioInput(raw, years, fallback);
    const p = aggregatePretaxFromSources(s.pretaxBenefitSources, false);
    expect(p.preTax401kSpouse1).toBe(5_000);
    expect(p.preTaxHsaSpouse1).toBe(1_000);
    expect(p.traditionalIraSpouse1).toBe(0);
    expect(s.useItemizedDeductions).toBe(true);
    expect(sumLabeledAmountSources(s.itemizedDeductions)).toBe(20_000);
  });

  it("fills income sources when missing on v4", () => {
    const s = sanitizeScenarioInput({ version: 4, taxYear: 2025 }, years, fallback);
    expect(s.incomeSources.length).toBeGreaterThan(0);
  });

  it("ignores non-v4 payloads and uses the default scenario for that tax year", () => {
    const s = sanitizeScenarioInput(
      { version: 2, taxYear: 2025, filingStatus: "single" },
      years,
      fallback,
    );
    const expected = fallbackScenario(2025);
    expect(s.taxYear).toBe(expected.taxYear);
    expect(s.filingStatus).toBe(expected.filingStatus);
    expect(s.useItemizedDeductions).toBe(expected.useItemizedDeductions);
    expect(s.incomeSources.length).toBe(expected.incomeSources.length);
  });
});

describe("serialize / deserialize scenario", () => {
  const years = [2024, 2025];
  const fallback = 2025;

  it("roundtrips", () => {
    const input = baseInput({
      pretaxBenefitSources: withPretaxTotals({ preTax401kSpouse1: 5_000 }),
      federalTaxCredits: withFederalCreditsTotal(1_500),
    });
    const json = serializeScenarioInput(input);
    const back = deserializeScenarioInput(json, years, fallback);
    expect(back).not.toBeNull();
    expect(aggregatePretaxFromSources(back!.pretaxBenefitSources, false).preTax401kSpouse1).toBe(5_000);
    expect(sumLabeledAmountSources(back!.federalTaxCredits)).toBe(1_500);
  });

  it("decodeURIComponent fallback for URL-encoded JSON", () => {
    const input = baseInput();
    const encoded = encodeURIComponent(serializeScenarioInput(input));
    const back = deserializeScenarioInput(encoded, years, fallback);
    expect(back).not.toBeNull();
    expect(back!.taxYear).toBe(2025);
  });

  it("returns null for garbage", () => {
    expect(deserializeScenarioInput("not-json", years, fallback)).toBeNull();
  });

  it("getScenarioPresets is non-empty", () => {
    expect(getScenarioPresets().length).toBeGreaterThan(0);
  });
});

describe("buildScenarioSummaryText", () => {
  it("includes key lines from a real calculation", () => {
    const result = calculateTaxes(baseInput());
    expect(result).not.toBeNull();
    const text = buildScenarioSummaryText(result!);
    expect(text).toContain("Tax Visualizer scenario");
    expect(text).toContain("Take-home pay");
  });

  it("handles no positive income sources", () => {
    const r = calculateTaxes(
      baseInput({
        incomeSources: [newIncomeSource({ kind: "wages", amount: 0 })],
      }),
    );
    expect(r).not.toBeNull();
    const text = buildScenarioSummaryText(r!);
    expect(text).toContain("Income sources: none entered");
  });
});
