import { describe, expect, it } from "vitest";
import { currencyFormatter, deltaLabel, percentFormatter } from "~/components/taxSummary/format";

describe("taxSummary format", () => {
  it("deltaLabel signs and uses formatter", () => {
    expect(deltaLabel(110, 100, currencyFormatter)).toMatch(/\+/);
    expect(deltaLabel(90, 100, currencyFormatter)).not.toMatch(/\+-/);
    expect(deltaLabel(0, 0, percentFormatter)).toContain("0");
  });
});
