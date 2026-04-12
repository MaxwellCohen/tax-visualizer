import type { ChartNode } from "~/components/taxSankey/chartTypes";

export function linkStroke(targetNode: ChartNode): string {
  if (targetNode.kind === "payrollOrdinaryStrip") return "var(--sankey-link-deferred)";
  if (targetNode.kind === "taxesFederal" || targetNode.kind === "taxesPayroll") {
    return "var(--sankey-link-tax)";
  }
  if (targetNode.kind === "federalCredits") return "var(--sankey-link-credits)";
  if (targetNode.kind === "keep") return "var(--sankey-link-keep)";
  if (targetNode.kind === "deferredSink") return "var(--sankey-link-deferred)";
  if (targetNode.kind === "deductionBenefitSink") {
    return targetNode.deductionBenefitSinkRole === "takeHome"
      ? "var(--sankey-link-keep)"
      : "var(--sankey-link-deferred)";
  }
  return "var(--sankey-link)";
}

export function nodeFill(node: ChartNode): string {
  switch (node.kind) {
    case "incomeSource":
      return "var(--sankey-node-income)";
    case "ordinaryTaxableIncome":
      return "var(--sankey-node-3)";
    case "longTermTaxableIncome":
    case "ltcgDeductionShield":
    case "ltcgBracket":
      return "var(--sankey-node-ltcg)";
    case "standardDeduction":
    case "deduction":
      return "var(--sankey-node-2)";
    case "deductionShield":
      return "var(--sankey-node-5)";
    case "deductionBenefitSink":
      return node.deductionBenefitSinkRole === "takeHome"
        ? "var(--sankey-node-keep)"
        : "var(--sankey-node-deferred)";
    case "ordinaryBracket":
      return "var(--sankey-node-4)";
    case "payrollOrdinaryStrip":
      return "var(--sankey-node-deferred)";
    case "taxesFederal":
    case "taxesPayroll":
      return "var(--sankey-node-6)";
    case "federalCredits":
      return "var(--sankey-node-credits)";
    case "keep":
    case "pretaxContribution":
      return "var(--sankey-node-keep)";
    case "deferredSink":
      return "var(--sankey-node-deferred)";
    default:
      return "var(--sankey-node-7)";
  }
}
