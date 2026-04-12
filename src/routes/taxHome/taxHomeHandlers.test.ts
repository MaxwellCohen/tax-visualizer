import type { Setter } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateTaxes, rowsToTaxCalculationInputs } from "~/lib/taxCalc";
import { aggregatePretaxFromSources } from "~/lib/taxCalc.pretaxBenefitSource";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { getScenarioPresets } from "~/lib/taxScenario";
import { createTaxHomeHandlers } from "~/routes/taxHome/taxHomeHandlers";

describe("createTaxHomeHandlers", () => {
  const presets = getScenarioPresets();
  const availableYears = [2025];
  const defaultYear = 2025;
  let taxInput = baseInput();
  const setTaxInput = vi.fn((v: typeof taxInput) => {
    taxInput = v;
  });
  let baseline: typeof taxInput | null = null;
  const setBaselineInput = vi.fn((v: typeof baseline) => {
    baseline = v;
  });
  const showStatus = vi.fn();

  const ctx = () => ({
    presets,
    availableYears,
    defaultYear,
    taxInput: () => taxInput,
    setTaxInput: setTaxInput as unknown as Setter<typeof taxInput>,
    baselineInput: () => baseline,
    setBaselineInput: setBaselineInput as unknown as Setter<typeof baseline>,
    taxResult: () => calculateTaxes(taxInput),
    showStatus,
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    baseline = null;
  });

  it("applyPreset updates input and status", () => {
    taxInput = baseInput();
    const h = createTaxHomeHandlers(ctx());
    h.applyPreset("singleW2");
    expect(setTaxInput).toHaveBeenCalled();
    expect(showStatus).toHaveBeenCalledWith(expect.stringContaining("preset"));
  });

  it("applyPreset no-ops for unknown id", () => {
    setTaxInput.mockClear();
    createTaxHomeHandlers(ctx()).applyPreset("nope");
    expect(setTaxInput).not.toHaveBeenCalled();
  });

  it("copySummary requires result", async () => {
    taxInput = baseInput({ taxYear: 1900 });
    const h = createTaxHomeHandlers(ctx());
    await h.copySummary();
    expect(showStatus).toHaveBeenCalledWith(expect.stringContaining("valid"));
  });

  it("copySummary uses clipboard when available", async () => {
    taxInput = baseInput();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await createTaxHomeHandlers(ctx()).copySummary();
    expect(writeText).toHaveBeenCalled();
    expect(showStatus).toHaveBeenCalledWith("Scenario summary copied.");
  });

  it("copySummary reports when clipboard is unavailable", async () => {
    showStatus.mockClear();
    taxInput = baseInput();
    vi.stubGlobal("navigator", {} as Navigator);
    await createTaxHomeHandlers(ctx()).copySummary();
    expect(showStatus).toHaveBeenCalledWith("Clipboard access is unavailable in this browser.");
  });

  it("copyShareLink writes location href to clipboard", async () => {
    taxInput = baseInput();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("window", { location: { href: "https://example.test/page" } });
    await createTaxHomeHandlers(ctx()).copyShareLink();
    expect(writeText).toHaveBeenCalledWith("https://example.test/page");
  });

  it("saveBaseline persists to localStorage", () => {
    taxInput = baseInput({ pretaxRows: withPretaxTotals({ preTax401kSpouse1: 1_000 }) });
    const setItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { setItem, removeItem: vi.fn(), getItem: vi.fn() } });
    createTaxHomeHandlers(ctx()).saveBaseline();
    expect(setBaselineInput).toHaveBeenCalled();
    expect(setItem).toHaveBeenCalled();
  });

  it("loadBaseline applies stored scenario", () => {
    taxInput = baseInput();
    baseline = baseInput({ pretaxRows: withPretaxTotals({ preTax401kSpouse1: 500 }) });
    setTaxInput.mockClear();
    createTaxHomeHandlers(ctx()).loadBaseline();
    expect(setTaxInput).toHaveBeenCalled();
  });

  it("loadBaseline no-ops without baseline", () => {
    baseline = null;
    setTaxInput.mockClear();
    createTaxHomeHandlers(ctx()).loadBaseline();
    expect(setTaxInput).not.toHaveBeenCalled();
  });

  it("clearBaseline removes storage key", () => {
    baseline = baseInput();
    const removeItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { setItem: vi.fn(), removeItem, getItem: vi.fn() } });
    createTaxHomeHandlers(ctx()).clearBaseline();
    expect(removeItem).toHaveBeenCalled();
  });

  it("resetScenario restores starter", () => {
    taxInput = baseInput({ pretaxRows: withPretaxTotals({ preTax401kSpouse1: 9_000 }) });
    createTaxHomeHandlers(ctx()).resetScenario();
    expect(setTaxInput).toHaveBeenCalled();
    const last = setTaxInput.mock.calls.at(-1)![0];
    expect(
      aggregatePretaxFromSources(rowsToTaxCalculationInputs(last.rows).pretaxBenefitSources, false).preTax401kSpouse1,
    ).toBe(0);
  });
});
