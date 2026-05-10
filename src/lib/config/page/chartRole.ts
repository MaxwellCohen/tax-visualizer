import type { ChartRole } from "./pageConfig.types";

export type SummaryChartRole = Extract<
  ChartRole,
  "income" | "pretax" | "deduction" | "tax" | "credit" | "takehome" | "rate"
>;

const SUMMARY_CHART_ROLE_LABELS: Record<SummaryChartRole, string> = {
  income: "Income",
  pretax: "Pre-tax",
  deduction: "Deductions",
  tax: "Taxes",
  credit: "Credits",
  takehome: "Take-home",
  rate: "Rates",
};

export function asSummaryChartRole(role?: ChartRole): SummaryChartRole | undefined {
  switch (role) {
    case "income":
    case "pretax":
    case "deduction":
    case "tax":
    case "credit":
    case "takehome":
    case "rate":
      return role;
    default:
      return undefined;
  }
}

export function getSummaryChartRoleLabel(role: SummaryChartRole): string {
  return SUMMARY_CHART_ROLE_LABELS[role];
}
