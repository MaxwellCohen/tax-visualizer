import { describe, expect, it } from "vitest";
import { getTaxYearFromRows, rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import { getAvailableTaxYears } from "~/lib/taxData.accessors";
import { serializeScenarioInput } from "~/lib/taxScenario";
import { aggregatePretaxFromSources } from "~/lib/taxCalc.pretaxBenefitSource";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { cloneScenario, starterScenario } from "~/routes/taxHome/scenarioInit";

describe("scenarioInit", () => {
  const years = getAvailableTaxYears();
  const fallback = years[0]!;

  it("starterScenario matches tax year", () => {
    const s = starterScenario(2025);
    expect(getTaxYearFromRows(s.rows)).toBe(2025);
    expect(s.rows.filter(r => r.type === "income").length).toBe(1);
  });

  it("cloneScenario roundtrips through serialize", () => {
    const input = baseInput({ pretaxRows: withPretaxTotals({ preTax401kSpouse1: 3_000 }) });
    const copy = cloneScenario(input, years, fallback);
    expect(
      aggregatePretaxFromSources(
        rowsToTaxCalculationInputs(copy.rows).pretaxBenefitSources,
        false,
        getTaxYearFromRows(copy.rows),
      ).preTax401kSpouse1,
    ).toBe(3_000);
    expect(serializeScenarioInput(copy)).toBe(serializeScenarioInput(input));
  });
});
