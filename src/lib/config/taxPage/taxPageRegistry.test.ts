import { describe, expect, it } from "vitest";
import {
  TAX_PAGE_REGISTRY_PHASE_NAMES,
  getConfigItems,
} from "~/lib/config/taxPage/taxPage.config";
import { getAvailableTaxYears, getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import { calculateAllConfigValues } from "~/lib/tax/calc/calculateTaxes";
import { fallbackScenario } from "~/lib/tax/scenario/sanitizeHelpers";
import { electiveDeferrals401kFamilyExcludingCatchUp } from "~/lib/config/taxPage/rowMetrics";
import type { TaxFormRow } from "~/lib/tax/form/types";

describe("tax page registry", () => {
  it("phase names stay aligned with docs/tax-config-items.md assembly list", () => {
    expect(TAX_PAGE_REGISTRY_PHASE_NAMES).toEqual([
      "incomeInputs",
      "pretaxInputs",
      "deductionInputs",
      "pretaxDeductionsNodes",
      "creditInputs",
      "incomeNodes",
      "deductionAmountNodes",
      "zeroTaxIncomeNodes",
      "payrollTaxInput",
      "pretaxIncomeNodes",
      "taxNodes",
      "mekkoSliceNodes",
      "bracketItems",
      "endingNodes",
    ]);
  });

  it("config item ids are unique for a modeled year", () => {
    const year = getAvailableTaxYears()[0];
    expect(year).toBeDefined();
    const taxData = getTaxYearConfig(year!);
    expect(taxData).not.toBeNull();
    const items = getConfigItems(taxData!, "single");
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("calculateAllConfigValues", () => {
  it("computes stable values for the default scenario", () => {
    const year = getAvailableTaxYears()[0] ?? 2026;
    const taxData = getTaxYearConfig(year);
    expect(taxData).not.toBeNull();
    const form = fallbackScenario(year);
    const items = calculateAllConfigValues(form, taxData!, "single");
    const byId = new Map(items.map((i) => [i.id, i.computedValue]));
    expect(byId.get("totalIncome")).toBe(90_000);
    expect(Number.isFinite(byId.get("wages"))).toBe(true);
  });
});

describe("electiveDeferrals401kFamilyExcludingCatchUp", () => {
  it("sums only configured elective subcategory keys (not catch-up)", () => {
    const baseKey = "input-pretax-401K-preTax401kSpouse1";
    const catchUpKey = "input-pretax-401K-electiveCatchUpSpouse1";
    const rows: TaxFormRow[] = [
      {
        type: "pretax",
        id: "a",
        kind: baseKey,
        label: "401",
        amount: 1000,
      },
      {
        type: "pretax",
        id: "b",
        kind: catchUpKey,
        label: "catch",
        amount: 500,
      },
    ];
    expect(electiveDeferrals401kFamilyExcludingCatchUp(rows)).toBe(1000);
  });
});
