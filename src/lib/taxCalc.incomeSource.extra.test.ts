import { afterEach, describe, expect, it, vi } from "vitest";
import { incomeSourceDisplayLabel, newIncomeSource } from "~/lib/taxCalc.incomeSource";

describe("taxCalc.incomeSource", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("incomeSourceDisplayLabel uses default when label blank", () => {
    const s = newIncomeSource({ kind: "wages", label: "  ", amount: 1 });
    expect(incomeSourceDisplayLabel(s)).toContain("W-2");
  });

  it("newIncomeSource falls back when crypto is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    const a = newIncomeSource();
    const b = newIncomeSource();
    expect(a.id).toMatch(/^inc-/);
    expect(b.id).not.toBe(a.id);
  });
});
