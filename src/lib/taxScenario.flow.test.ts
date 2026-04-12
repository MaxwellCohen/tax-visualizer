import { describe, expect, it } from "vitest";
import { calculateTaxes, incomeSourcesToRows, newIncomeSource } from "~/lib/taxCalc";
import { getTaxYearFromRows, getUseItemizedFromRows, rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
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
    expect(getTaxYearFromRows(s.rows)).toBe(2025);
    expect(s.rows.filter(r => r.type === "income").length).toBeGreaterThan(0);
  });
});

describe("sanitizeScenarioInput", () => {
  const years = [2024, 2025];
  const fallback = 2025;

  it("falls back for non-object input", () => {
    const s = sanitizeScenarioInput(null, years, fallback);
    expect(getTaxYearFromRows(s.rows)).toBe(fallback);
  });

  it("clamps oversized 401(k) on v5 payload", () => {
    const raw = {
      version: 5 as const,
      rows: [
        { type: "setting" as const, id: "taxYear" as const, value: 2025 },
        { type: "setting" as const, id: "filingStatus" as const, value: "single" as const },
        { type: "income" as const, id: "a", kind: "wages" as const, label: "x", amount: 10_000 },
        { type: "pretax" as const, id: "p1", kind: "preTax401kSpouse1" as const, label: "", amount: 999_999 },
        { type: "setting" as const, id: "useItemizedDeductions" as const, value: false },
        { type: "deduction" as const, id: "d1", kind: "otherItemized" as const, label: "", amount: 0 },
        { type: "credit" as const, id: "c1", kind: "otherFederalCredit" as const, label: "", amount: 0 },
      ],
    };
    const s = sanitizeScenarioInput(raw, years, fallback);
    expect(
      aggregatePretaxFromSources(rowsToTaxCalculationInputs(s.rows).pretaxBenefitSources, false).preTax401kSpouse1,
    ).toBe(23_500);
  });

  it("maps v5 pretax and itemized rows", () => {
    const raw = {
      version: 5 as const,
      rows: [
        { type: "setting" as const, id: "taxYear" as const, value: 2025 },
        { type: "setting" as const, id: "filingStatus" as const, value: "single" as const },
        { type: "income" as const, id: "a", kind: "wages" as const, label: "", amount: 50_000 },
        { type: "pretax" as const, id: "p1", kind: "preTax401kSpouse1" as const, label: "", amount: 5_000 },
        { type: "pretax" as const, id: "p2", kind: "preTaxHsaSpouse1" as const, label: "", amount: 1_000 },
        { type: "pretax" as const, id: "p3", kind: "preTaxOther" as const, label: "", amount: 2 },
        { type: "setting" as const, id: "useItemizedDeductions" as const, value: true },
        { type: "deduction" as const, id: "d1", kind: "charitable" as const, label: "", amount: 20_000 },
        { type: "credit" as const, id: "c1", kind: "otherFederalCredit" as const, label: "", amount: 0 },
      ],
    };
    const s = sanitizeScenarioInput(raw, years, fallback);
    const p = aggregatePretaxFromSources(rowsToTaxCalculationInputs(s.rows).pretaxBenefitSources, false);
    expect(p.preTax401kSpouse1).toBe(5_000);
    expect(p.preTaxHsaSpouse1).toBe(1_000);
    expect(p.traditionalIraSpouse1).toBe(0);
    expect(getUseItemizedFromRows(s.rows)).toBe(true);
    expect(
      sumLabeledAmountSources(rowsToTaxCalculationInputs(s.rows).itemizedDeductions),
    ).toBe(20_000);
  });

  it("fills rows when empty on v5", () => {
    const s = sanitizeScenarioInput({ version: 5, rows: [] }, years, fallback);
    expect(s.rows.filter(r => r.type === "income").length).toBeGreaterThan(0);
  });

  it("ignores non-v5 payloads and uses the default scenario for that tax year", () => {
    const s = sanitizeScenarioInput(
      { version: 2, taxYear: 2025, filingStatus: "single" },
      years,
      fallback,
    );
    const expected = fallbackScenario(2025);
    expect(getTaxYearFromRows(s.rows)).toBe(getTaxYearFromRows(expected.rows));
    expect(getUseItemizedFromRows(s.rows)).toBe(getUseItemizedFromRows(expected.rows));
    expect(s.rows.filter(r => r.type === "income").length).toBe(expected.rows.filter(r => r.type === "income").length);
  });
});

describe("serialize / deserialize scenario", () => {
  const years = [2024, 2025];
  const fallback = 2025;

  it("roundtrips", () => {
    const input = baseInput({
      pretaxRows: withPretaxTotals({ preTax401kSpouse1: 5_000 }),
      creditRows: withFederalCreditsTotal(1_500),
    });
    const json = serializeScenarioInput(input);
    const back = deserializeScenarioInput(json, years, fallback);
    expect(back).not.toBeNull();
    expect(
      aggregatePretaxFromSources(rowsToTaxCalculationInputs(back!.rows).pretaxBenefitSources, false).preTax401kSpouse1,
    ).toBe(5_000);
    expect(sumLabeledAmountSources(rowsToTaxCalculationInputs(back!.rows).federalTaxCredits)).toBe(1_500);
  });

  it("decodeURIComponent fallback for URL-encoded JSON", () => {
    const input = baseInput();
    const encoded = encodeURIComponent(serializeScenarioInput(input));
    const back = deserializeScenarioInput(encoded, years, fallback);
    expect(back).not.toBeNull();
    expect(getTaxYearFromRows(back!.rows)).toBe(2025);
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
        incomeRows: incomeSourcesToRows([newIncomeSource({ kind: "wages", amount: 0 })]),
      }),
    );
    expect(r).not.toBeNull();
    const text = buildScenarioSummaryText(r!);
    expect(text).toContain("Income sources: none entered");
  });
});
