import type { TaxChartMetrics } from "~/lib/taxForm.types";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { formatLtcgBracketLabel, formatOrdinaryBracketLabel } from "~/lib/taxCharts.sankeyFormat";
import type { SankeyChartNode } from "~/lib/taxCharts.types";
import {
  ltcgBracketNodeId,
  ltcgSegmentKey,
  ordinaryBracketNodeId,
  ordinarySegmentKey,
} from "~/lib/taxCharts.sankeySegmentKeys";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";
import type { SankeyMetricAppendContext } from "~/lib/config/sankeyMetricAppendContext";

function addNode(nodeMap: Map<string, SankeyChartNode>, node: SankeyChartNode): void {
  if (!nodeMap.has(node.id)) {
    nodeMap.set(node.id, node);
  }
}

function pushBracketIncomeLinkAndRetainedSlice(
  s: SankeyScratch,
  sourceId: string,
  nodeId: string,
  linkFlowValue: number,
  taxWithNiit: number,
  economicIncomeAmount: number,
): void {
  s.links.push({
    sourceId,
    targetId: nodeId,
    value: linkFlowValue,
  });
  const retainedAmount = Math.max(0, economicIncomeAmount - taxWithNiit);
  if (retainedAmount > 0) {
    s.takeHomePoolSlices.push({ sourceId: nodeId, weight: retainedAmount });
  }
}

/** Registry `ordinaryFederalSegments` — ordinary bracket column nodes + links from OTI. */
export function appendOrdinaryBracketSankey(ctx: SankeyMetricAppendContext): void {
  const { m, s } = ctx;
  const oScale = s.ordinaryBracketLinkScale;
  for (const segment of m.ordinaryFederalSegments) {
    const nodeId = ordinaryBracketNodeId(segment);
    const niitPart = s.niitBySegment.ordinary.get(ordinarySegmentKey(segment)) ?? 0;
    const taxWithNiit = segment.taxAmount + niitPart;
    addNode(s.nodeMap, {
      id: nodeId,
      label: formatOrdinaryBracketLabel(segment),
      kind: "ordinaryBracket",
      amount: segment.incomeAmount,
      incomeAmount: segment.incomeAmount,
      taxAmount: taxWithNiit,
      marginalRate: segment.marginalRate,
      rangeStart: segment.rangeStart,
      rangeEnd: segment.rangeEnd,
    });
    const linkFlow = segment.incomeAmount * oScale;
    pushBracketIncomeLinkAndRetainedSlice(
      s,
      SANKEY_IDS.ordinaryTaxableIncome,
      nodeId,
      linkFlow,
      taxWithNiit,
      segment.incomeAmount,
    );
  }
}

/** Registry `longTermCapitalGainsSegments` — LTCG bracket column + links from LTCG taxable. */
export function appendLtcgBracketSankey(ctx: SankeyMetricAppendContext): void {
  const { m, s } = ctx;
  for (const segment of m.longTermCapitalGainsSegments) {
    const nodeId = ltcgBracketNodeId(segment);
    const niitPart = s.niitBySegment.ltcg.get(ltcgSegmentKey(segment)) ?? 0;
    const taxWithNiit = segment.taxAmount + niitPart;
    addNode(s.nodeMap, {
      id: nodeId,
      label: formatLtcgBracketLabel(segment),
      kind: "ltcgBracket",
      amount: segment.incomeAmount,
      incomeAmount: segment.incomeAmount,
      taxAmount: taxWithNiit,
      marginalRate: segment.marginalRate,
      rangeStart: segment.rangeStart,
      rangeEnd: segment.rangeEnd,
    });
    pushBracketIncomeLinkAndRetainedSlice(
      s,
      SANKEY_IDS.longTermTaxableIncome,
      nodeId,
      segment.incomeAmount,
      taxWithNiit,
      segment.incomeAmount,
    );
  }
}
