import { describe, expect, it } from "vitest";
import { computeTaxMetricLines } from "~/lib/config/chartMetricsRegistry";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import { getTaxYearConfig } from "~/lib/taxData.accessors.impl";

describe("chartMetricsRegistry", () => {
  it("aggregates pre-tax rows using full PretaxBenefitKind strings (401(k) and traditional IRA)", () => {
    const data = baseInput({
      pretaxRows: [
        ...withPretaxTotals({ "input-pretax-401K-preTax401kSpouse1": 10_000 }),
        ...withPretaxTotals({ "input-pretax-traditionalIra-traditionalIraSpouse1": 3_000 }),
      ],
    });
    const inputs = rowsToTaxCalculationInputs(data.rows);
    const config = getTaxYearConfig(2025);
    expect(config).toBeDefined();
    const lines = computeTaxMetricLines(data.rows, inputs, config!);
    const preTax401k = lines.find((l) => l.metricsKey === "preTax401k")?.value as number;
    const traditionalIra = lines.find((l) => l.metricsKey === "traditionalIra")?.value as number;
    const preTaxTotal = lines.find((l) => l.metricsKey === "preTaxTotal")?.value as number;
    expect(preTax401k).toBe(10_000);
    expect(traditionalIra).toBe(3_000);
    expect(preTaxTotal).toBe(10_000);
  });
});