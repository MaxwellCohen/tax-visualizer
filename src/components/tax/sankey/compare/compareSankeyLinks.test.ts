import { describe, expect, it } from "vitest";
import { compareSankeyItemsByRowAndCol } from "~/components/tax/sankey/compare/compareSankeyLinks";

describe("compareSankeyItemsByRowAndCol", () => {
  it("sorts by each item's own column before row", () => {
    expect(
      compareSankeyItemsByRowAndCol(
        { row: 100, col: 1 } as never,
        { row: 0, col: 2 } as never,
      ),
    ).toBeLessThan(0);
  });
});
