import { describe, expect, it } from "vitest";
import { calculateTaxes } from "~/lib/taxCalc.calculateTaxes";
import { baseInput } from "~/lib/taxCalc.test.helpers";
import { buildMekkoRows } from "~/lib/taxCharts";
import { computeMekkoLayout } from "~/components/taxMekko/mekkoLayout";
import { H, W, pct } from "~/components/taxMekko/constants";
import { money } from "~/lib/moneyFormat";
import { incomeY, incomeYAxis, niceStep } from "~/components/taxMekko/incomeScale";

describe("mekko constants formatters", () => {
  it("exports layout numbers and formatters", () => {
    expect(W).toBeGreaterThan(0);
    expect(H).toBeGreaterThan(0);
    expect(money.format(1000)).toContain("1,000");
    expect(pct.format(0.1)).toContain("%");
  });
});

describe("incomeScale", () => {
  it("niceStep handles edge cases", () => {
    expect(niceStep(0, true)).toBe(1);
    expect(niceStep(-5, true)).toBe(1);
    expect(niceStep(37, true)).toBeGreaterThan(0);
    expect(niceStep(37, false)).toBeGreaterThan(0);
  });

  it("incomeYAxis yields ticks", () => {
    const { yMax, yTicks } = incomeYAxis(100_000, 400);
    expect(yMax).toBeGreaterThanOrEqual(100_000);
    expect(yTicks.length).toBeGreaterThan(2);
  });

  it("incomeY maps income to pixel", () => {
    expect(incomeY(10, 100, 50_000, 0)).toBeGreaterThan(incomeY(10, 100, 50_000, 25_000));
  });
});

describe("computeMekkoLayout", () => {
  it("returns layout for non-empty rows", () => {
    const result = calculateTaxes(baseInput())!;
    const rows = result.display?.mekko.rows ?? buildMekkoRows(result);
    const layout = computeMekkoLayout(result, rows);
    expect(layout).toBeDefined();
    expect(layout!.rowLayouts.length).toBe(rows.length);
    expect(layout!.yTicks.length).toBeGreaterThan(0);
  });

  it("returns undefined when no rows", () => {
    const result = calculateTaxes(baseInput())!;
    expect(computeMekkoLayout(result, [])).toBeUndefined();
  });
});
