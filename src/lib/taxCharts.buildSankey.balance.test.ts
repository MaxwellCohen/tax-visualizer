import { describe, expect, it } from "vitest";
import { calculateTaxes, chartMetricNumeric, incomeSourcesToRows } from "~/lib/taxCalc";
import { baseInput, withFederalCreditsTotal } from "~/lib/taxCalc.test.helpers";
import { buildSankeyChartData } from "~/lib/taxCharts.sankeyGraph";

function linkTotalsByNode(links: { sourceId: string; targetId: string; value: number }[]) {
  const inBy = new Map<string, number>();
  const outBy = new Map<string, number>();
  for (const l of links) {
    if (l.value <= 0) continue;
    outBy.set(l.sourceId, (outBy.get(l.sourceId) ?? 0) + l.value);
    inBy.set(l.targetId, (inBy.get(l.targetId) ?? 0) + l.value);
  }
  return { inBy, outBy };
}

/**
 * Every **intermediate** node (both inflow and outflow) conserves flow. Pure sources (only out) and
 * sinks (only in), e.g. take-home and tax terminals, are excluded.
 */
function assertSankeyConserved(links: { sourceId: string; targetId: string; value: number }[]) {
  const { inBy, outBy } = linkTotalsByNode(links);
  const ids = new Set<string>([...inBy.keys(), ...outBy.keys()]);
  const tol = 1.5; // allocateProportional uses Math.round
  for (const id of ids) {
    const inn = inBy.get(id) ?? 0;
    const out = outBy.get(id) ?? 0;
    if (inn <= 0 || out <= 0) continue;
    expect(Math.abs(inn - out), `node ${id}: in ${inn} vs out ${out}`).toBeLessThanOrEqual(tol);
  }
}

describe("buildSankeyChartData flow conservation", () => {
  it("balances each intermediate node (wages + payroll strip case)", () => {
    const result = calculateTaxes(
      baseInput({
        incomeRows: incomeSourcesToRows([{ id: "1", kind: "wages", label: "Wages", amount: 120_000 }]),
      }),
    );
    expect(result).not.toBeNull();
    const oti = chartMetricNumeric(result!, "ordinaryTaxableIncome");
    expect(oti).toBeGreaterThan(0);
    expect(chartMetricNumeric(result!, "payrollTax")).toBeGreaterThan(0);
    const { links } = buildSankeyChartData(result!);
    const fromOti = links.filter(l => l.sourceId === "ordinary-taxable-income");
    const otiOut = fromOti.reduce((s, l) => s + l.value, 0);
    expect(Math.abs(otiOut - oti)).toBeLessThanOrEqual(1.5);
    assertSankeyConserved(links);
  });

  it("balances with LTCG + ordinary", () => {
    const result = calculateTaxes(
      baseInput({
        incomeRows: incomeSourcesToRows([
          { id: "1", kind: "wages", label: "Wages", amount: 80_000 },
          { id: "2", kind: "longTermCapGains", label: "LTCG", amount: 20_000 },
        ]),
      }),
    );
    expect(result).not.toBeNull();
    const { links } = buildSankeyChartData(result!);
    assertSankeyConserved(links);
  });

  it("balances with federal credits on input (pipeline may clamp to allowed)", () => {
    const result = calculateTaxes(
      baseInput({
        incomeRows: incomeSourcesToRows([{ id: "1", kind: "wages", label: "Wages", amount: 90_000 }]),
        creditRows: withFederalCreditsTotal(4_000),
      }),
    );
    expect(result).not.toBeNull();
    assertSankeyConserved(buildSankeyChartData(result!).links);
  });

  it("balances when NIIT applies (high investment income)", () => {
    const result = calculateTaxes(
      baseInput({
        incomeRows: incomeSourcesToRows([
          { id: "1", kind: "wages", label: "Wages", amount: 350_000 },
          { id: "2", kind: "longTermCapGains", label: "LTCG", amount: 120_000 },
        ]),
      }),
    );
    expect(result).not.toBeNull();
    expect(chartMetricNumeric(result!, "federalNetInvestmentIncomeTax")).toBeGreaterThan(0);
    assertSankeyConserved(buildSankeyChartData(result!).links);
  });
});
