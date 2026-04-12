import { describe, expect, it } from "vitest";
import type { ChartLink, ChartNode } from "~/components/taxSankey/chartTypes";
import { sankeyLinkPath } from "~/components/taxSankey/chartTypes";
import { compareSankeyLinks } from "~/components/taxSankey/compareSankeyLinks";
import { compareSankeySiblings } from "~/components/taxSankey/compareSankeySiblings";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/taxSankey/layout";
import { linkStroke, nodeFill } from "~/components/taxSankey/sankeyColors";
import { sankeyLabelLines } from "~/components/taxSankey/sankeyNodeLabels";

const N = (x: Partial<ChartNode> & Pick<ChartNode, "id" | "kind" | "label">): ChartNode =>
  ({ value: 0, ...x }) as ChartNode;

describe("sankey layout constants", () => {
  it("exports dimensions", () => {
    expect(SANKEY_WIDTH).toBeGreaterThan(0);
    expect(SANKEY_HEIGHT).toBeGreaterThan(0);
  });
});

describe("compareSankeySiblings", () => {
  it("orders ordinary vs long-term taxable", () => {
    const o = N({ id: "o", kind: "ordinaryTaxableIncome", label: "O" });
    const l = N({ id: "l", kind: "longTermTaxableIncome", label: "L" });
    expect(compareSankeySiblings(o, l)).toBeGreaterThan(0);
    expect(compareSankeySiblings(l, o)).toBeLessThan(0);
  });

  it("ranks income sources by kind then label", () => {
    const ltcg = N({
      id: "a",
      kind: "incomeSource",
      label: "B",
      incomeKind: "longTermCapGains",
    });
    const wages = N({ id: "b", kind: "incomeSource", label: "A", incomeKind: "wages" });
    expect(compareSankeySiblings(ltcg, wages)).toBeLessThan(0);
    const o1 = N({ id: "c", kind: "incomeSource", label: "B", incomeKind: "wages" });
    const o2 = N({ id: "d", kind: "incomeSource", label: "A", incomeKind: "wages" });
    expect(compareSankeySiblings(o2, o1)).toBeLessThan(0);
  });

  it("falls back to SANKEY_SIBLING_RANK for mixed kinds", () => {
    const i = N({ id: "i", kind: "incomeSource", label: "I", incomeKind: "wages" });
    const k = N({ id: "k", kind: "keep", label: "K" });
    expect(compareSankeySiblings(i, k)).not.toBe(0);
  });

  it("orders ordinaryBracket by marginal rate then range start", () => {
    const low = N({
      id: "a",
      kind: "ordinaryBracket",
      label: "A",
      marginalRate: 0.1,
      rangeStart: 0,
    });
    const high = N({
      id: "b",
      kind: "ordinaryBracket",
      label: "B",
      marginalRate: 0.22,
      rangeStart: 0,
    });
    expect(compareSankeySiblings(low, high)).toBeGreaterThan(0);
    const sameRateA = N({
      id: "c",
      kind: "ordinaryBracket",
      label: "C",
      marginalRate: 0.12,
      rangeStart: 0,
    });
    const sameRateB = N({
      id: "d",
      kind: "ordinaryBracket",
      label: "D",
      marginalRate: 0.12,
      rangeStart: 100,
    });
    expect(compareSankeySiblings(sameRateA, sameRateB)).toBeGreaterThan(0);
  });

  it("orders ltcgBracket by marginal rate", () => {
    const a = N({ id: "a", kind: "ltcgBracket", label: "A", marginalRate: 0 });
    const b = N({ id: "b", kind: "ltcgBracket", label: "B", marginalRate: 0.15 });
    expect(compareSankeySiblings(a, b)).toBeGreaterThan(0);
  });

  it("orders deferredSink by label", () => {
    const a = N({ id: "a", kind: "deferredSink", label: "B" });
    const b = N({ id: "b", kind: "deferredSink", label: "A" });
    expect(compareSankeySiblings(a, b)).toBeGreaterThan(0);
  });

  it("incomeSource falls back to label when kind order ties", () => {
    const a = N({
      id: "a",
      kind: "incomeSource",
      label: "B",
      incomeKind: "wages",
    });
    const b = N({
      id: "b",
      kind: "incomeSource",
      label: "A",
      incomeKind: "wages",
    });
    expect(compareSankeySiblings(a, b)).toBeGreaterThan(0);
  });
});

describe("compareSankeyLinks", () => {
  it("sorts by shared source targets", () => {
    const s = N({ id: "s", kind: "incomeSource", label: "S", incomeKind: "wages" });
    const t1 = N({ id: "t1", kind: "keep", label: "A" });
    const t2 = N({ id: "t2", kind: "keep", label: "B" });
    const a: ChartLink = { source: s, target: t1, value: 1 } as ChartLink;
    const b: ChartLink = { source: s, target: t2, value: 1 } as ChartLink;
    expect(compareSankeyLinks(a, b)).toBeLessThan(0);
  });

  it("sorts by shared target sources", () => {
    const t = N({ id: "t", kind: "keep", label: "T" });
    const s1 = N({ id: "s1", kind: "incomeSource", label: "A", incomeKind: "wages" });
    const s2 = N({ id: "s2", kind: "incomeSource", label: "B", incomeKind: "wages" });
    const a: ChartLink = { source: s1, target: t, value: 1 } as ChartLink;
    const b: ChartLink = { source: s2, target: t, value: 1 } as ChartLink;
    expect(compareSankeyLinks(a, b)).not.toBe(0);
  });

  it("breaks ties by comparing sources then targets", () => {
    const s1 = N({ id: "s1", kind: "incomeSource", label: "M", incomeKind: "wages" });
    const s2 = N({ id: "s2", kind: "incomeSource", label: "N", incomeKind: "wages" });
    const t1 = N({ id: "t1", kind: "keep", label: "A" });
    const t2 = N({ id: "t2", kind: "keep", label: "B" });
    const a: ChartLink = { source: s1, target: t1, value: 1 } as ChartLink;
    const b: ChartLink = { source: s2, target: t2, value: 1 } as ChartLink;
    expect(compareSankeyLinks(a, b)).not.toBe(0);
  });
});

describe("sankeyLinkPath", () => {
  it("returns an SVG path for link endpoints", () => {
    const src = { x0: 0, x1: 1, y0: 2, y1: 4 } as ChartNode;
    const tgt = { x0: 5, x1: 6, y0: 3, y1: 5 } as ChartNode;
    const d = sankeyLinkPath({ source: src, target: tgt } as ChartLink);
    expect(typeof d).toBe("string");
    expect(d.length).toBeGreaterThan(10);
  });
});

describe("sankeyColors", () => {
  it("linkStroke by target kind", () => {
    expect(linkStroke(N({ id: "t", kind: "taxesFederal", label: "T" }))).toContain("tax");
    expect(linkStroke(N({ id: "k", kind: "keep", label: "K" }))).toContain("keep");
    expect(linkStroke(N({ id: "d", kind: "deferredSink", label: "D" }))).toContain("deferred");
    expect(
      linkStroke(N({ id: "s", kind: "deductionBenefitSink", label: "", deductionBenefitSinkRole: "takeHome" })),
    ).toContain("keep");
    expect(
      linkStroke(N({ id: "s2", kind: "deductionBenefitSink", label: "", deductionBenefitSinkRole: "accounting" })),
    ).toContain("deferred");
    expect(linkStroke(N({ id: "x", kind: "ordinaryTaxableIncome", label: "X" }))).toBe("var(--sankey-link)");
  });

  it("nodeFill covers representative kinds", () => {
    expect(nodeFill(N({ id: "2", kind: "ltcgBracket", label: "" }))).toContain("ltcg");
    expect(nodeFill(N({ id: "3", kind: "pretaxContribution", label: "" }))).toContain("keep");
    expect(nodeFill(N({ id: "i", kind: "incomeSource", label: "" }))).toContain("income");
    expect(nodeFill(N({ id: "o", kind: "ordinaryTaxableIncome", label: "" }))).toContain("sankey-node-3");
    expect(nodeFill(N({ id: "l", kind: "longTermTaxableIncome", label: "" }))).toContain("ltcg");
    expect(nodeFill(N({ id: "s", kind: "standardDeduction", label: "" }))).toContain("sankey-node-2");
    expect(nodeFill(N({ id: "d", kind: "deduction", label: "" }))).toContain("sankey-node-2");
    expect(nodeFill(N({ id: "ds", kind: "deductionShield", label: "" }))).toContain("sankey-node-5");
    expect(
      nodeFill(
        N({
          id: "dbs",
          kind: "deductionBenefitSink",
          label: "",
          deductionBenefitSinkRole: "accounting",
        }),
      ),
    ).toContain("deferred");
    expect(
      nodeFill(
        N({
          id: "dbs2",
          kind: "deductionBenefitSink",
          label: "",
          deductionBenefitSinkRole: "takeHome",
        }),
      ),
    ).toContain("keep");
    expect(nodeFill(N({ id: "ob", kind: "ordinaryBracket", label: "" }))).toContain("sankey-node-4");
    expect(nodeFill(N({ id: "tx", kind: "taxesFederal", label: "" }))).toContain("sankey-node-6");
    expect(nodeFill(N({ id: "k", kind: "keep", label: "" }))).toContain("keep");
    const fallbackNode = { id: "unk", label: "", kind: "not-a-real-kind" } as ChartNode;
    expect(nodeFill(fallbackNode)).toContain("sankey-node-7");
  });
});

describe("sankeyLabelLines", () => {
  it("compact standard deduction when short", () => {
    const lines = sankeyLabelLines(
      N({
        id: "sd",
        kind: "standardDeduction",
        label: "Standard deduction",
        y0: 0,
        y1: 20,
        amount: 15_000,
      }),
    );
    expect(lines.compact).toBe(true);
    expect(lines.line1).toContain("Std");
  });

  it("bracket two-line when tall enough", () => {
    const lines = sankeyLabelLines(
      N({
        id: "ob",
        kind: "ordinaryBracket",
        label: "10% ($0-$11,925)",
        y0: 0,
        y1: 80,
        incomeAmount: 5_000,
        taxAmount: 500,
        marginalRate: 0.1,
      }),
    );
    expect(lines.compact).toBe(false);
    expect(lines.line1).toContain("10%");
  });

  it("deferredSink short label", () => {
    const lines = sankeyLabelLines(
      N({
        id: "d",
        kind: "deferredSink",
        label: "401(k) deferred",
        y0: 0,
        y1: 40,
        amount: 1_000,
      }),
    );
    expect(lines.line1).toMatch(/401/);
  });

  it("standard deduction tall layout uses two lines", () => {
    const lines = sankeyLabelLines(
      N({
        id: "sd",
        kind: "standardDeduction",
        label: "Standard deduction",
        y0: 0,
        y1: 80,
        amount: 15_000,
      }),
    );
    expect(lines.compact).toBe(false);
    expect(lines.line2).toBeDefined();
  });

  it("ltcg bracket uses LTCG prefix", () => {
    const lines = sankeyLabelLines(
      N({
        id: "lb",
        kind: "ltcgBracket",
        label: "LTCG 15%",
        y0: 0,
        y1: 80,
        incomeAmount: 10_000,
        taxAmount: 1_500,
        marginalRate: 0.15,
      }),
    );
    expect(lines.line1).toContain("LTCG");
  });

  it("compact pretaxContribution label maps Other pre-tax", () => {
    const lines = sankeyLabelLines(
      N({
        id: "p",
        kind: "pretaxContribution",
        label: "Other pre-tax",
        y0: 0,
        y1: 10,
        value: 500,
      }),
    );
    expect(lines.compact).toBe(true);
    expect(lines.line1).toContain("Other");
  });
});
