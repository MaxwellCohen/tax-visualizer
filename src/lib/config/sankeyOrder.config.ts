import type { IncomeKind } from "~/lib/taxCalc.types";

export type SankeyOrderKind = {
  kind: IncomeKind | string;
  order: number;
};

export const INCOME_KIND_SANKEY_ORDER: SankeyOrderKind[] = [
  { kind: "longTermCapGains", order: 0 },
  { kind: "shortTermCapGains", order: 1 },
  { kind: "wages", order: 2 },
  { kind: "ordinary", order: 3 },
  { kind: "selfEmployment", order: 4 },
];

export const INCOME_KIND_CHART_ORDER: IncomeKind[] = INCOME_KIND_SANKEY_ORDER.map((k) => k.kind as IncomeKind);

/**
 * One row per Sankey `kind`: vertical order, semantic column, rect fill, and link stroke (for links
 * whose **target** is this node). `taxSankeyNodeAlign` maps `column` onto d3 layers proportionally
 * when graph depth is tight.
 *
 * Columns (semantic): 0 income → 1 taxable + std/itemized deduction bars → 2 shield / pretax / deferred →
 * 3 brackets + payroll strip → 4 taxes & take-home.
 */
export type SankeyNodeLayoutEntry = {
  kind: string;
  /** Vertical sibling sort (lower = higher on chart). */
  order: number;
  /** Semantic column index before proportional mapping to d3 layers. */
  column: number;
  /** SVG rect `fill` (CSS variable). */
  fill: string;
  /** Stroke for link paths whose target is this node (`stroke` on the path). */
  linkStroke: string;
  /** Only `deductionBenefitSink`: fill when `deductionBenefitSinkRole === "accounting"`. */
  fillBenefitAccounting?: string;
  /** Only `deductionBenefitSink`: link stroke when role is accounting. */
  linkStrokeBenefitAccounting?: string;
};

export const SANKEY_NODE_LAYOUT: SankeyNodeLayoutEntry[] = [
  { kind: "incomeSource", order: 0, column: 0, fill: "var(--sankey-node-income)", linkStroke: "var(--sankey-link)" },

  {
    kind: "ltcgDeductionShield",
    order: 1,
    column: 1,
    fill: "var(--sankey-node-ltcg)",
    linkStroke: "var(--sankey-link)",
  },
  {
    kind: "longTermTaxableIncome",
    order: 2,
    column: 1,
    fill: "var(--sankey-node-ltcg)",
    linkStroke: "var(--sankey-link)",
  },
  {
    kind: "ordinaryTaxableIncome",
    order: 3,
    column: 1,
    fill: "var(--sankey-node-3)",
    linkStroke: "var(--sankey-link)",
  },
  {
    kind: "standardDeduction",
    order: 4,
    column: 1,
    fill: "var(--sankey-node-2)",
    linkStroke: "var(--sankey-link)",
  },
  { kind: "deduction", order: 5, column: 1, fill: "var(--sankey-node-2)", linkStroke: "var(--sankey-link)" },

  {
    kind: "pretaxContribution",
    order: 6,
    column: 2,
    fill: "var(--sankey-node-keep)",
    linkStroke: "var(--sankey-link)",
  },
  {
    kind: "deductionShield",
    order: 10,
    column: 2,
    fill: "var(--sankey-node-5)",
    linkStroke: "var(--sankey-link)",
  },
  {
    kind: "deductionBenefitSink",
    order: 11,
    column: 2,
    fill: "var(--sankey-node-keep)",
    linkStroke: "var(--sankey-link-keep)",
    fillBenefitAccounting: "var(--sankey-node-deferred)",
    linkStrokeBenefitAccounting: "var(--sankey-link-deferred)",
  },
  {
    kind: "deferredSink",
    order: 16,
    column: 2,
    fill: "var(--sankey-node-deferred)",
    linkStroke: "var(--sankey-link-deferred)",
  },

  {
    kind: "payrollOrdinaryStrip",
    order: 7,
    column: 3,
    fill: "var(--sankey-node-deferred)",
    linkStroke: "var(--sankey-link-deferred)",
  },
  {
    kind: "ltcgBracket",
    order: 8,
    column: 3,
    fill: "var(--sankey-node-ltcg)",
    linkStroke: "var(--sankey-link)",
  },
  {
    kind: "ordinaryBracket",
    order: 9,
    column: 3,
    fill: "var(--sankey-node-4)",
    linkStroke: "var(--sankey-link)",
  },

  {
    kind: "taxesPayroll",
    order: 12,
    column: 4,
    fill: "var(--sankey-node-6)",
    linkStroke: "var(--sankey-link-tax)",
  },
  {
    kind: "taxesFederal",
    order: 13,
    column: 4,
    fill: "var(--sankey-node-6)",
    linkStroke: "var(--sankey-link-tax)",
  },
  {
    kind: "federalCredits",
    order: 14,
    column: 4,
    fill: "var(--sankey-node-credits)",
    linkStroke: "var(--sankey-link-credits)",
  },
  { kind: "keep", order: 15, column: 4, fill: "var(--sankey-node-keep)", linkStroke: "var(--sankey-link-keep)" },
];

/** Fallback when a node kind is not listed (e.g. future kinds). */
export const SANKEY_NODE_FILL_DEFAULT = "var(--sankey-node-7)";
export const SANKEY_LINK_STROKE_DEFAULT = "var(--sankey-link)";

/** Highest semantic column index in {@link SANKEY_NODE_LAYOUT} (inclusive). */
export const SANKEY_VISUAL_SEMANTIC_MAX = Math.max(0, ...SANKEY_NODE_LAYOUT.map(e => e.column));

export const SANKEY_NODE_KIND_CHART_ORDER: Record<string, number> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map(k => [k.kind, k.order]),
);

export const SANKEY_VISUAL_COLUMN_BY_KIND: Record<string, number> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map(k => [k.kind, k.column]),
);

export const SANKEY_NODE_STYLE_BY_KIND: Record<string, SankeyNodeLayoutEntry> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map(e => [e.kind, e]),
);

export const INCOME_KIND_CHART_ORDER_BY_KIND: Record<IncomeKind, number> = Object.fromEntries(
  INCOME_KIND_SANKEY_ORDER.map((k) => [k.kind as IncomeKind, k.order]),
) as Record<IncomeKind, number>;
