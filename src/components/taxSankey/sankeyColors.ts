import type { ChartNode } from "~/components/taxSankey/chartTypes";

export function linkStroke(targetNode: ChartNode): string {
  if (targetNode.kind === "taxes") return "var(--sankey-link-tax)";
  if (targetNode.kind === "keep") return "var(--sankey-link-keep)";
  if (targetNode.kind === "deferredSink") return "var(--sankey-link-deferred)";
  return "var(--sankey-link)";
}

export function nodeFill(node: ChartNode): string {
  switch (node.kind) {
    case "grossIncome":
      return "var(--sankey-node-1)";
    case "incomeSource":
      return "var(--sankey-node-income)";
    case "ordinaryTaxableIncome":
      return "var(--sankey-node-3)";
    case "longTermTaxableIncome":
    case "ltcgBracket":
      return "var(--sankey-node-ltcg)";
    case "standardDeduction":
    case "deduction":
      return "var(--sankey-node-2)";
    case "deductionShield":
      return "var(--sankey-node-5)";
    case "ordinaryBracket":
      return "var(--sankey-node-4)";
    case "taxes":
      return "var(--sankey-node-6)";
    case "keep":
    case "pretaxContribution":
      return "var(--sankey-node-keep)";
    case "deferredSink":
      return "var(--sankey-node-deferred)";
    default:
      return "var(--sankey-node-7)";
  }
}
