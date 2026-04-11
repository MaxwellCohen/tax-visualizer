import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource } from "~/lib/taxCalc";
import { baseInput } from "~/lib/taxCalc.test.helpers";
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

  it("maps v2 payload and clamps pretax", () => {
    const raw = {
      version: 2,
      taxYear: 2025,
      filingStatus: "single",
      incomeSources: [{ id: "a", kind: "wages", label: "x", amount: 10_000 }],
      preTax401kSpouse1: 999_999,
      preTax401kSpouse2: 0,
      preTaxHsaSpouse1: 0,
      preTaxHsaSpouse2: 0,
      preTaxOther: 0,
      traditionalIraSpouse1: 0,
      traditionalIraSpouse2: 0,
      useItemizedDeductions: false,
      itemizedDeductions: 0,
    };
    const s = sanitizeScenarioInput(raw, years, fallback);
    expect(s.preTax401kSpouse1).toBe(23_500);
  });

  it("maps v1 legacy keys", () => {
    const raw = {
      taxYear: 2025,
      filingStatus: "single",
      incomeSources: [{ id: "a", kind: "wages" as const, label: "", amount: 50_000 }],
      preTax401k: 5_000,
      preTaxHsa: 1_000,
      preTaxOther: 2,
      useItemizedDeductions: true,
      itemizedDeductions: 20_000,
    };
    const s = sanitizeScenarioInput(raw, years, fallback);
    expect(s.preTax401kSpouse1).toBe(5_000);
    expect(s.preTaxHsaSpouse1).toBe(1_000);
    expect(s.traditionalIraSpouse1).toBe(0);
    expect(s.useItemizedDeductions).toBe(true);
  });

  it("fills income sources when missing", () => {
    const s = sanitizeScenarioInput({ version: 2, taxYear: 2025 }, years, fallback);
    expect(s.incomeSources.length).toBeGreaterThan(0);
  });
});

describe("serialize / deserialize scenario", () => {
  const years = [2024, 2025];
  const fallback = 2025;

  it("roundtrips", () => {
    const input = baseInput({ preTax401kSpouse1: 5_000 });
    const json = serializeScenarioInput(input);
    const back = deserializeScenarioInput(json, years, fallback);
    expect(back).not.toBeNull();
    expect(back!.preTax401kSpouse1).toBe(5_000);
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
