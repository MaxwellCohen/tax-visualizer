import type { ChartNode } from "~/components/taxSankey/chartTypes";
import {
  SANKEY_LINK_STROKE_DEFAULT,
  SANKEY_NODE_FILL_DEFAULT,
  SANKEY_NODE_STYLE_BY_KIND,
} from "~/lib/config/sankeyOrder.config";

export function linkStroke(targetNode: ChartNode): string {
  const row = SANKEY_NODE_STYLE_BY_KIND[targetNode.kind];
  if (!row) return SANKEY_LINK_STROKE_DEFAULT;
  if (targetNode.kind === "deductionBenefitSink" && row.linkStrokeBenefitAccounting) {
    return targetNode.deductionBenefitSinkRole === "takeHome" ? row.linkStroke : row.linkStrokeBenefitAccounting;
  }
  return row.linkStroke;
}

export function nodeFill(node: ChartNode): string {
  const row = SANKEY_NODE_STYLE_BY_KIND[node.kind];
  if (!row) return SANKEY_NODE_FILL_DEFAULT;
  if (node.kind === "deductionBenefitSink" && row.fillBenefitAccounting) {
    return node.deductionBenefitSinkRole === "takeHome" ? row.fill : row.fillBenefitAccounting;
  }
  return row.fill;
}
