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

export const SANKEY_NODE_KIND_ORDER: SankeyOrderKind[] = [
  { kind: "incomeSource", order: 0 },
  { kind: "ltcgDeductionShield", order: 1 },
  { kind: "longTermTaxableIncome", order: 2 },
  { kind: "ordinaryTaxableIncome", order: 3 },
  { kind: "standardDeduction", order: 4 },
  { kind: "deduction", order: 5 },
  { kind: "pretaxContribution", order: 6 },
  { kind: "ltcgBracket", order: 7 },
  { kind: "payrollOrdinaryStrip", order: 8 },
  { kind: "ordinaryBracket", order: 9 },
  { kind: "deductionShield", order: 10 },
  { kind: "deductionBenefitSink", order: 11 },
  { kind: "taxesPayroll", order: 12 },
  { kind: "taxesFederal", order: 13 },
  { kind: "federalCredits", order: 14 },
  { kind: "keep", order: 15 },
  { kind: "deferredSink", order: 16 },
];

export const INCOME_KIND_CHART_ORDER_BY_KIND: Record<IncomeKind, number> = Object.fromEntries(
  INCOME_KIND_SANKEY_ORDER.map((k) => [k.kind as IncomeKind, k.order])
) as Record<IncomeKind, number>;

export const SANKEY_NODE_KIND_CHART_ORDER: Record<string, number> = Object.fromEntries(
  SANKEY_NODE_KIND_ORDER.map((k) => [k.kind, k.order])
);