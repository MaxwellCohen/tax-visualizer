import type { ChartNode } from "~/components/taxSankey/chartTypes";

/**
 * Vertical order for d3-sankey sibling sort: lower number = higher on the chart.
 * Adjust ranks here to reorder flows (same-depth nodes are never compared across depths).
 */
export const SANKEY_SIBLING_RANK: Record<ChartNode["kind"], number> = {
  grossIncome: 0,
  incomeSource: 1,
  longTermTaxableIncome: 2,
  ordinaryTaxableIncome: 3,
  standardDeduction: 4,
  deduction: 5,
  pretaxContribution: 6,
  ltcgBracket: 7,
  ordinaryBracket: 8,
  deductionShield: 9,
  taxes: 10,
  keep: 11,
  deferredSink: 12,
};
