import { describe, expect, it } from "vitest";
import {
  clampToMax,
  filingStatusOptions,
  incomeKindOptions,
  labelForIncomeKind,
  parseCurrencyInput,
} from "~/components/taxInputForm/shared";

describe("taxInputForm shared", () => {
  it("option lists cover filing and income kinds", () => {
    expect(filingStatusOptions.map(o => o.value)).toContain("marriedJoint");
    expect(incomeKindOptions.map(o => o.value)).toContain("longTermCapGains");
  });

  it("parseCurrencyInput", () => {
    expect(parseCurrencyInput("12")).toBe(12);
    expect(parseCurrencyInput("x")).toBe(0);
    expect(parseCurrencyInput("-1")).toBe(0);
  });

  it("clampToMax", () => {
    expect(clampToMax(5, 3)).toBe(3);
    expect(clampToMax(-1, 10)).toBe(0);
    expect(clampToMax(5, NaN)).toBe(5);
  });

  it("labelForIncomeKind", () => {
    expect(labelForIncomeKind("wages")).toContain("W-2");
    expect(labelForIncomeKind("ordinary")).toContain("ordinary");
  });
});
