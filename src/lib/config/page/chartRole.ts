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

export function getChartRoleColorVar(role?: ChartRole): string {
  switch (role) {
    case "income":
      return "var(--chart-income)";
    case "pretax":
    case "seAdjustment":
      return "var(--chart-pretax)";
    case "deduction":
      return "var(--chart-deduction)";
    case "tax":
    case "payrollTax":
      return "var(--chart-tax)";
    case "credit":
      return "var(--chart-credit)";
    case "takehome":
    case "keep":
    case "ordinaryBracket":
      return "var(--chart-keep)";
    case "ltcg":
      return "var(--chart-ltcg)";
    case "rate":
    case "default":
    default:
      return "var(--chart-default)";
  }
}
