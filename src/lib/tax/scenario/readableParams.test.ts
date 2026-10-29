import { describe, expect, it } from "vitest";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import {
  clearedReadableScenarioParams,
  hasReadableScenarioParams,
  parseReadableAmount,
  parseReadableScenarioParams,
  scenarioFromReadableParams,
  scenarioInputToSearchParams,
} from "~/lib/tax/scenario/readableParams";
import { getLineItemDefinitions, LINE_ITEM_ALIASES } from "~/lib/tax/scenario/scenarioInput";
import { resolveInitialScenario, storedScenarioIfNoUrl } from "~/routes/taxHome/scenarioInit";
import { serializeScenarioInput } from "~/lib/tax/scenario/serialize";
import { taxFormDataFromParts } from "~/lib/tax/form/factories";

describe("readable scenario params", () => {
  it("every alias maps to a registry line-item kind", () => {
    const kinds = new Set(getLineItemDefinitions(getTaxYearConfig(2026)!, "marriedJoint").map((d) => d.id));
    for (const kind of Object.values(LINE_ITEM_ALIASES)) expect(kinds).toContain(kind);
  });

  it("parses settings, aliases, and full kind ids", () => {
    const input = parseReadableScenarioParams(
      {
        year: "2025",
        filingStatus: "marriedJoint",
        state: "ny",
        children: "2",
        itemize: "1",
        wages: "120,000",
        wages2: "$80000",
        "input-pretax-401K-preTax401kSpouse1": "10000",
        mortgage: "15_000",
      },
      2026,
    );
    expect(input).toEqual({
      year: 2025,
      filingStatus: "marriedJoint",
      state: "NY",
      qualifyingChildren: 2,
      otherDependents: 0,
      itemize: true,
      lineItems: {
        "income-ordinary-wages-spouse1": 120_000,
        "income-ordinary-wages-spouse2": 80_000,
        "input-pretax-401K-preTax401kSpouse1": 10_000,
        "deduction-mortgageInterest-mortgageInterest": 15_000,
      },
    });
  });

  it("falls back to defaults for invalid settings and skips invalid or unknown items", () => {
    const input = parseReadableScenarioParams(
      { year: "1990", filingStatus: "joint", state: "ZZ", wages: "abc", ltcg: "-5", hsa2: "100", utm_source: "x", stcg: "500" },
      2026,
    );
    expect(input).toEqual({
      year: 2026,
      filingStatus: "single",
      state: "none",
      qualifyingChildren: 0,
      otherDependents: 0,
      itemize: false,
      lineItems: { "income-ordinary-shortTermCapGains-shortTermCapGains-spouse1": 500 },
    });
  });

  it("returns null when no readable params are present", () => {
    expect(hasReadableScenarioParams({ utm_source: "x", whjobs: "[]" })).toBe(false);
    expect(parseReadableScenarioParams({ utm_source: "x" }, 2026)).toBeNull();
  });

  it("parseReadableAmount accepts common money formats only", () => {
    expect(parseReadableAmount("1,234.5")).toBe(1234.5);
    expect(parseReadableAmount("")).toBeNull();
    expect(parseReadableAmount("1e3x")).toBeNull();
    expect(parseReadableAmount("-1")).toBeNull();
  });

  it("round-trips through scenarioInputToSearchParams", () => {
    const params = { year: "2026", filingStatus: "single", state: "CA", wages: "90000", "401k": "5000" };
    const input = parseReadableScenarioParams(params, 2026)!;
    const out = Object.fromEntries(scenarioInputToSearchParams(input));
    expect(out).toEqual(params);
  });

  it("builds form rows with deterministic ids", () => {
    const form = scenarioFromReadableParams({ wages: "50000", salt: "8000" }, 2026)!;
    const lines = form.rows.filter((r) => r.type !== "setting");
    expect(lines).toEqual([
      { type: "income", id: "q-wages", kind: "income-ordinary-wages-spouse1", label: "", amount: 50_000 },
      { type: "deduction", id: "q-salt", kind: "deduction-salt-salt", label: "", amount: 8_000 },
    ]);
  });

  it("clears only readable params", () => {
    expect(clearedReadableScenarioParams({ wages: "1", year: "2026", whjobs: "[]" })).toEqual({
      wages: undefined,
      year: undefined,
    });
  });
});

describe("resolveInitialScenario with readable params", () => {
  it("prefers the legacy scenario JSON param over readable params", () => {
    const legacy = taxFormDataFromParts({
      taxYear: 2024,
      filingStatus: "headOfHousehold",
      incomeRows: [],
      pretaxRows: [],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const resolved = resolveInitialScenario({ scenario: serializeScenarioInput(legacy), wages: "1" }, 2026);
    expect(resolved).toEqual(legacy);
  });

  it("uses readable params when there is no scenario param and skips localStorage", () => {
    const resolved = resolveInitialScenario({ year: "2025", wages: "70000" }, 2026);
    expect(resolved.rows).toContainEqual({ type: "setting", id: "taxYear", value: 2025 });
    expect(resolved.rows).toContainEqual(
      expect.objectContaining({ type: "income", kind: "income-ordinary-wages-spouse1", amount: 70_000 }),
    );
    expect(storedScenarioIfNoUrl({ wages: "70000" })).toBeNull();
  });
});
