import { describe, expect, it } from "vitest";
import { calculateTaxes, newIncomeSource } from "~/lib/taxCalc";
import { baseInput } from "~/lib/taxCalc.test.helpers";
import type { TaxSegment } from "~/lib/taxCalc.types";
import { formatLtcgBracketLabel, formatOrdinaryBracketLabel } from "~/lib/taxCharts.sankeyFormat";
import { addNode, sortedIncomeSources, splitTakeHomeAndPayrollByPool } from "~/lib/taxCharts.sankeyHelpers";
import { netInvestmentIncomeTaxPerSegment } from "~/lib/taxCharts.sankeyNiit";
import { sankeyPretaxRowsFromResult } from "~/lib/taxCharts.sankeyPretaxRows";
import type { SankeyChartNode } from "~/lib/taxCharts.types";

describe("taxCharts.sankey units", () => {
  it("addNode dedupes by id", () => {
    const m = new Map<string, SankeyChartNode>();
    const n: SankeyChartNode = { id: "a", label: "A", kind: "grossIncome", amount: 1 };
    addNode(m, n);
    addNode(m, n);
    expect(m.size).toBe(1);
  });

  it("sortedIncomeSources orders by chart kind then label", () => {
    const result = calculateTaxes(
      baseInput({
        incomeSources: [
          newIncomeSource({ kind: "longTermCapGains", amount: 1, label: "B" }),
          newIncomeSource({ kind: "wages", amount: 2, label: "A" }),
        ],
      }),
    );
    expect(result).not.toBeNull();
    const sorted = sortedIncomeSources(result!);
    expect(sorted[0]!.kind).toBe("longTermCapGains");
  });

  it("splitTakeHomeAndPayrollByPool handles empty and allocates remainder on last slice", () => {
    expect(splitTakeHomeAndPayrollByPool([], 100, 10).size).toBe(0);
    expect(splitTakeHomeAndPayrollByPool([{ sourceId: "x", weight: 0 }], 100, 10).size).toBe(0);
    const m = splitTakeHomeAndPayrollByPool(
      [
        { sourceId: "a", weight: 1 },
        { sourceId: "b", weight: 1 },
      ],
      101,
      7,
    );
    expect(m.get("a")!.keep + m.get("b")!.keep).toBe(101);
    expect(m.get("a")!.payroll + m.get("b")!.payroll).toBe(7);
  });

  it("formatOrdinaryBracketLabel open-ended range", () => {
    const seg: TaxSegment = {
      id: "x",
      kind: "ordinaryFederal",
      incomeAmount: 1,
      taxAmount: 0,
      marginalRate: 0.22,
      rangeStart: 100_000,
      rangeEnd: null,
    };
    const s = formatOrdinaryBracketLabel(seg);
    expect(s).toContain("22%");
    expect(s).toContain("$100,000+");
  });

  it("formatLtcgBracketLabel", () => {
    const seg: TaxSegment = {
      id: "x",
      kind: "longTermCapGains",
      incomeAmount: 1,
      taxAmount: 0,
      marginalRate: 0.15,
      rangeStart: 0,
      rangeEnd: null,
    };
    expect(formatLtcgBracketLabel(seg)).toBe("LTCG 15%");
  });

  it("netInvestmentIncomeTaxPerSegment returns empty when no NIIT", () => {
    const r = calculateTaxes(baseInput())!;
    const r0 = { ...r, federalNetInvestmentIncomeTax: 0 };
    const { ordinary, ltcg } = netInvestmentIncomeTaxPerSegment(r0);
    expect(ordinary.size).toBe(0);
    expect(ltcg.size).toBe(0);
  });

  it("sankeyPretaxRowsFromResult lists configured rows", () => {
    const r = calculateTaxes(
      baseInput({
        preTax401kSpouse1: 1,
        preTaxHsaSpouse1: 2,
        preTaxOther: 3,
        traditionalIraSpouse1: 4,
      }),
    )!;
    const rows = sankeyPretaxRowsFromResult(r);
    expect(rows.map(x => x.amount)).toEqual([1, 2, 3, 4]);
  });
});
