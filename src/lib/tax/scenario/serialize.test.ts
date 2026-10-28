import { describe, expect, it } from "vitest";
import {
  deserializeScenarioInputFromSearchParams,
  parseTaxFormData,
  serializeScenarioInput,
} from "~/lib/tax/scenario/serialize";
import { SCENARIO_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";
import { encodedScenarioIfFitsUrl } from "~/routes/taxHome/taxHomePersistence";
import { incomeSourcesToRows, taxFormDataFromParts } from "~/lib/tax/form/factories";
import { newIncomeSource } from "~/lib/tax/calc/labeledAmountSource";

const validFormParts = () => ({
  taxYear: 2026,
  filingStatus: "single" as const,
  incomeRows: incomeSourcesToRows([
    newIncomeSource({ kind: "income-ordinary-wages-spouse1", amount: 50_000, label: "50% match" }),
  ]),
  pretaxRows: [],
  useItemizedDeductions: false,
  deductionRows: [],
  creditRows: [],
});

const validForm = () => taxFormDataFromParts(validFormParts());

describe("parseTaxFormData", () => {
  it("rejects malformed rows instead of silently dropping them", () => {
    expect(parseTaxFormData([{ type: "income", id: "x" }])).toBeNull();
    expect(parseTaxFormData([{ type: "setting", id: "taxYear", value: "2026" }])).toBeNull();
    expect(parseTaxFormData({ rows: [{ type: "pretax", id: "p", kind: "k", label: "L", amount: Number.NaN }] })).toBeNull();
  });

  it("round-trips the state of residence and rejects unknown states", () => {
    const form = taxFormDataFromParts({ ...validFormParts(), residenceState: "NY" });
    expect(parseTaxFormData(JSON.parse(serializeScenarioInput(form)))).toEqual(form);
    expect(parseTaxFormData([{ type: "setting", id: "residenceState", value: "ZZ" }])).toBeNull();
  });

  it("round-trips a valid scenario, including percent signs in labels", () => {
    const form = validForm();
    const parsed = parseTaxFormData(JSON.parse(serializeScenarioInput(form)));
    expect(parsed).toEqual(form);
    const fromQuery = deserializeScenarioInputFromSearchParams({
      [SCENARIO_QUERY_PARAM]: serializeScenarioInput(form),
    });
    expect(fromQuery).toEqual(form);
  });
});

describe("encodedScenarioIfFitsUrl", () => {
  it("omits the scenario when the URL would exceed the length cap", () => {
    const form = validForm();
    const huge = {
      rows: form.rows.map((row) =>
        row.type === "income" ? { ...row, label: "x".repeat(12_000) } : row,
      ),
    };
    expect(encodedScenarioIfFitsUrl("https://example.com/", huge)).toBeUndefined();
    expect(encodedScenarioIfFitsUrl("https://example.com/", form)).toEqual(serializeScenarioInput(form));
  });
});
