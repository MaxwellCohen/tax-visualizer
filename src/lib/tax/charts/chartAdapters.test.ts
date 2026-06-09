import { describe, expect, it } from "vitest";
import { calculateAllConfigValues } from "~/lib/tax/calc/calculateTaxes";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import { fallbackScenario } from "~/lib/tax/scenario/sanitizeHelpers";
import { buildMekkoFromConfig } from "~/lib/tax/charts/buildMekko";
import { buildSankeyLayoutFromCalculatedConfig } from "~/lib/tax/charts/buildSankeyLayout";
import { buildSummaryFromConfig } from "~/lib/tax/charts/buildSummary";

describe("calculated-config chart adapters", () => {
  it("derive Sankey, Mekko, and Summary data from calculated config", () => {
    const taxData = getTaxYearConfig(2026);
    expect(taxData).not.toBeNull();
    const calculatedConfig = calculateAllConfigValues(fallbackScenario(2026), taxData!, "single");

    const sankey = buildSankeyLayoutFromCalculatedConfig(calculatedConfig);
    const mekko = buildMekkoFromConfig(calculatedConfig);
    const summary = buildSummaryFromConfig(calculatedConfig);

    expect(sankey?.nodes.length).toBeGreaterThan(0);
    expect(sankey?.links.length).toBeGreaterThan(0);
    expect(mekko?.rows.length).toBeGreaterThan(0);
    expect(mekko?.summary.taxTotal).toBeGreaterThan(0);
    expect(summary?.sections.length).toBeGreaterThan(0);
  });
});
