import { describe, expect, it } from "vitest";
import { TAX_CALC_REGISTRY } from "~/lib/config/TAX_CALC_REGISTRY";
import { computeTaxMetricLines } from "~/lib/config/chartMetricsRegistry";
import { PIPELINE_COMPUTED_ROW_ORDER, TAX_CHART_METRICS_KEYS } from "~/lib/config/pipelineTaxResult.config";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import { getTaxYearConfig } from "~/lib/taxData";

describe("pipelineTaxResult.config", () => {
  it("TAX_CHART_METRICS_KEYS matches the chart metrics registry (unique, full list)", () => {
    const keys = new Set<string>(TAX_CHART_METRICS_KEYS);
    expect(keys.size).toBe(TAX_CHART_METRICS_KEYS.length);
    expect(TAX_CHART_METRICS_KEYS.length).toBe(TAX_CALC_REGISTRY.length);
    for (let i = 0; i < TAX_CHART_METRICS_KEYS.length; i++) {
      expect(TAX_CHART_METRICS_KEYS[i]).toBe(TAX_CALC_REGISTRY[i]!.metricsKey);
    }
  });

  it("pipeline computed row order lists every chart metric key in registry order", () => {
    expect(PIPELINE_COMPUTED_ROW_ORDER.length).toBe(TAX_CHART_METRICS_KEYS.length);
    for (let i = 0; i < TAX_CHART_METRICS_KEYS.length; i++) {
      expect(PIPELINE_COMPUTED_ROW_ORDER[i]).toBe(TAX_CHART_METRICS_KEYS[i]);
    }
  });

  it("aggregates pre-tax rows using full PretaxBenefitKind strings (401(k) and traditional IRA)", () => {
    const data = baseInput({
      pretaxRows: [
        ...withPretaxTotals({ preTax401kSpouse1: 10_000 }),
        ...withPretaxTotals({ traditionalIraSpouse1: 3_000 }),
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
