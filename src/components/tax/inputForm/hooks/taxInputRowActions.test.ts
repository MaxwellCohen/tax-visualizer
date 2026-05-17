import { describe, expect, it } from "vitest";
import { taxFormDataEquals } from "~/components/tax/inputForm/hooks/taxInputRowActions";
import { fallbackScenario } from "~/lib/tax/scenario/sanitizeHelpers";

describe("taxFormDataEquals", () => {
  it("treats identical row tuples as equal", () => {
    const a = fallbackScenario(2026);
    const b = { rows: structuredClone(a.rows) };
    expect(taxFormDataEquals(a, b)).toBe(true);
  });

  it("detects amount drift", () => {
    const a = fallbackScenario(2026);
    const b = {
      rows: a.rows.map((r, i) => (i === a.rows.length - 1 ? { ...r, amount: 1 } : r)),
    };
    expect(taxFormDataEquals(a, b as typeof a)).toBe(false);
  });
});
