import { describe, expect, it } from "vitest";
import { compareSankeyLinks } from "~/components/taxSankey/compareSankeyLinks";
import type { ChartLink, ChartNode } from "~/components/taxSankey/chartTypes";

describe("compareSankeyLinks", () => {
  it("places federal-credits → keep before other sources → keep (top of take-home bar in d3-sankey)", () => {
    const keep = { id: "keep", kind: "keep", label: "Take-home" } as ChartNode;
    const credits = { id: "federal-credits", kind: "federalCredits", label: "Federal credits" } as ChartNode;
    const bracket = {
      id: "ordinary-bracket-0",
      kind: "ordinaryBracket",
      label: "22%",
    } as ChartNode;

    const fromCredits: ChartLink = { source: credits, target: keep, value: 100 };
    const fromBracket: ChartLink = { source: bracket, target: keep, value: 5000 };

    expect(compareSankeyLinks(fromCredits, fromBracket)).toBeLessThan(0);
    expect(compareSankeyLinks(fromBracket, fromCredits)).toBeGreaterThan(0);
  });
});
