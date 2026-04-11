import type { TaxResult } from "~/lib/taxCalc";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { formatLtcgBracketLabel, formatOrdinaryBracketLabel } from "~/lib/taxCharts.sankeyFormat";
import { addNode } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export function appendSankeyBracketNodes(result: TaxResult, s: SankeyScratch): void {
  for (const segment of result.ordinaryFederalSegments) {
    const nodeId = `ordinary-bracket-${segment.id}`;
    const niitPart = s.niitBySegment.ordinary.get(segment.id) ?? 0;
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
    s.links.push({
      sourceId: SANKEY_IDS.ordinaryTaxableIncome,
      targetId: nodeId,
      value: segment.incomeAmount,
    });
    const retainedAmount = Math.max(0, segment.incomeAmount - taxWithNiit);
    if (retainedAmount > 0) {
      s.takeHomePoolSlices.push({ sourceId: nodeId, weight: retainedAmount });
    }
  }

  for (const segment of result.longTermCapitalGainsSegments) {
    const nodeId = `ltcg-bracket-${segment.id}`;
    const niitPart = s.niitBySegment.ltcg.get(segment.id) ?? 0;
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
    s.links.push({
      sourceId: SANKEY_IDS.longTermTaxableIncome,
      targetId: nodeId,
      value: segment.incomeAmount,
    });
    const retainedAmount = Math.max(0, segment.incomeAmount - taxWithNiit);
    if (retainedAmount > 0) {
      s.takeHomePoolSlices.push({ sourceId: nodeId, weight: retainedAmount });
    }
  }
}
