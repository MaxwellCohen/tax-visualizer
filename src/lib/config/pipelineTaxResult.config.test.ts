import { describe, expect, it } from "vitest";
import { CHART_METRICS_REGISTRY } from "~/lib/config/chartMetricsRegistry";
import {
  CHART_METRICS_NOT_EMITTED_AS_COMPUTED_ROWS,
  PIPELINE_COMPUTED_ROW_ORDER,
  TAX_CHART_METRICS_KEYS,
} from "~/lib/config/pipelineTaxResult.config";

describe("pipelineTaxResult.config", () => {
  it("TAX_CHART_METRICS_KEYS matches the chart metrics registry (unique, full list)", () => {
    const keys = new Set<string>(TAX_CHART_METRICS_KEYS);
    expect(keys.size).toBe(TAX_CHART_METRICS_KEYS.length);
    expect(TAX_CHART_METRICS_KEYS.length).toBe(CHART_METRICS_REGISTRY.length);
    for (let i = 0; i < TAX_CHART_METRICS_KEYS.length; i++) {
      expect(TAX_CHART_METRICS_KEYS[i]).toBe(CHART_METRICS_REGISTRY[i]!.metricsKey);
    }
  });

  it("computed row order is chart keys minus non-row metrics", () => {
    expect(PIPELINE_COMPUTED_ROW_ORDER.length).toBe(
      TAX_CHART_METRICS_KEYS.length - CHART_METRICS_NOT_EMITTED_AS_COMPUTED_ROWS.size,
    );
    const chartSet = new Set<string>(TAX_CHART_METRICS_KEYS);
    const rowSet = new Set<string>(PIPELINE_COMPUTED_ROW_ORDER);
    for (const k of CHART_METRICS_NOT_EMITTED_AS_COMPUTED_ROWS) {
      expect(chartSet.has(k)).toBe(true);
      expect(rowSet.has(k)).toBe(false);
    }
    for (const k of PIPELINE_COMPUTED_ROW_ORDER) {
      expect(chartSet.has(k)).toBe(true);
    }
  });
});
