import { describe, expect, it } from "vitest";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";
import { buildSankeyTopology } from "~/lib/tax/charts/sankeyTopology";

function item(id: string): CalculatedConfigItem {
  return {
    id,
    labels: { default: id },
    computedValue: 1,
  };
}

describe("buildSankeyTopology", () => {
  it("derives ordinary bracket topology from calculated config ids", () => {
    const topology = buildSankeyTopology([
      item("bracket-0-node"),
      item("bracket-0-income"),
      item("bracket-0-keep"),
      item("bracket-0-credits"),
      item("bracket-0-tax"),
      item("bracket-1-node"),
      item("bracket-1-income"),
      item("bracket-1-keep"),
      item("bracket-1-credits"),
      item("bracket-1-tax"),
      item("ltcg-credits"),
    ]);

    expect(topology.get("bracket-1-node")?.node).toEqual({ row: 9, col: 3 });
    expect(topology.get("bracket-1-tax")?.links?.[0]).toMatchObject({
      source: "bracket-1-node",
      target: "federalIncomeTax",
      row: 12,
      col: 3,
    });
    expect(topology.get("ltcg-credits")?.links?.[0]).toMatchObject({
      source: "ltcg-income",
      target: "takeHomePay",
    });
  });
});
