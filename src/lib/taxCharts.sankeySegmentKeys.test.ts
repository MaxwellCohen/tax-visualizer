import { describe, expect, it } from "vitest";
import { calculateTaxes, incomeSourcesToRows, resolveTaxChartMetrics } from "~/lib/taxCalc";
import { baseInput } from "~/lib/taxCalc.test.helpers";
import { netInvestmentIncomeTaxPerSegment } from "~/lib/taxCharts.sankeyNiit";
import {
  ltcgBracketNodeId,
  ltcgSegmentKey,
  ordinaryBracketNodeId,
  ordinarySegmentKey,
} from "~/lib/taxCharts.sankeySegmentKeys";

describe("sankey segment keys", () => {
  it("ordinary bracket ids follow ordinarySegmentKey", () => {
    const result = calculateTaxes(
      baseInput({
        incomeRows: incomeSourcesToRows([{ id: "1", kind: "wages", label: "Wages", amount: 120_000 }]),
      }),
    );
    expect(result).not.toBeNull();
    const m = resolveTaxChartMetrics(result!);
    for (const seg of m.ordinaryFederalSegments) {
      const key = ordinarySegmentKey(seg);
      expect(ordinaryBracketNodeId(seg)).toBe(`ordinary-bracket-${key}`);
    }
  });

  it("NIIT per-segment map keys are always valid ordinary/ltcg segment keys (not seg-i)", () => {
    const result = calculateTaxes(
      baseInput({
        incomeRows: incomeSourcesToRows([
          { id: "1", kind: "wages", label: "Wages", amount: 350_000 },
          { id: "2", kind: "longTermCapGains", label: "LTCG", amount: 120_000 },
        ]),
      }),
    );
    expect(result).not.toBeNull();
    const m = resolveTaxChartMetrics(result!);
    const niit = netInvestmentIncomeTaxPerSegment(m);
    const ordKeys = new Set(m.ordinaryFederalSegments.map(s => ordinarySegmentKey(s)));
    const ltcgKeys = new Set(m.longTermCapitalGainsSegments.map(s => ltcgSegmentKey(s)));
    for (const k of niit.ordinary.keys()) {
      expect(ordKeys.has(k), `unexpected ordinary NIIT key ${k}`).toBe(true);
      expect(k).not.toMatch(/^seg-/);
    }
    for (const k of niit.ltcg.keys()) {
      expect(ltcgKeys.has(k), `unexpected ltcg NIIT key ${k}`).toBe(true);
      expect(k).not.toMatch(/^seg-/);
    }
  });
});
