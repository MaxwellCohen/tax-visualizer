import type { IncomeKind } from "~/lib/taxCalc.types";

/** Lower value = higher in Sankey / earlier in sorted income source lists. */
export const INCOME_KIND_CHART_ORDER: Record<IncomeKind, number> = {
  longTermCapGains: 0,
  shortTermCapGains: 1,
  wages: 2,
  ordinary: 3,
};

export const SANKEY_IDS = {
  grossIncome: "gross-income",
  ordinaryTaxableIncome: "ordinary-taxable-income",
  longTermTaxableIncome: "long-term-taxable-income",
  taxes: "taxes",
  keep: "keep",
} as const;
