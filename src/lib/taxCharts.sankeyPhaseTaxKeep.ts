import type { TaxResult } from "~/lib/taxCalc";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import { addNode, splitTakeHomeAndPayrollByPool } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export function appendSankeyTaxKeepAndFallback(result: TaxResult, s: SankeyScratch): void {
  addNode(s.nodeMap, {
    id: SANKEY_IDS.taxes,
    label: "Taxes & payroll",
    kind: "taxes",
    amount: result.federalIncomeTax + result.payrollTax,
  });
  addNode(s.nodeMap, {
    id: SANKEY_IDS.keep,
    label: "Take-home",
    kind: "keep",
    amount: result.takeHomePay,
  });

  const poolTotal = s.takeHomePoolSlices.reduce((acc, x) => acc + x.weight, 0);
  const split =
    poolTotal > 0
      ? splitTakeHomeAndPayrollByPool(s.takeHomePoolSlices, result.takeHomePay, result.payrollTax)
      : new Map<string, { keep: number; payroll: number }>();

  for (const segment of result.ordinaryFederalSegments) {
    const nodeId = `ordinary-bracket-${segment.id}`;
    const part = split.get(nodeId) ?? { keep: 0, payroll: 0 };
    const niitPart = s.niitBySegment.ordinary.get(segment.id) ?? 0;
    const taxTotal = segment.taxAmount + niitPart + part.payroll;
    if (taxTotal > 0) {
      s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.taxes, value: taxTotal });
    }
    if (part.keep > 0) {
      s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.keep, value: part.keep });
    }
  }

  for (const segment of result.longTermCapitalGainsSegments) {
    const nodeId = `ltcg-bracket-${segment.id}`;
    const part = split.get(nodeId) ?? { keep: 0, payroll: 0 };
    const niitPart = s.niitBySegment.ltcg.get(segment.id) ?? 0;
    const taxTotal = segment.taxAmount + niitPart + part.payroll;
    if (taxTotal > 0) {
      s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.taxes, value: taxTotal });
    }
    if (part.keep > 0) {
      s.links.push({ sourceId: nodeId, targetId: SANKEY_IDS.keep, value: part.keep });
    }
  }

  if (result.deductionAmount > 0) {
    const part = split.get("deduction-shield") ?? { keep: 0, payroll: 0 };
    if (part.payroll > 0) {
      s.links.push({ sourceId: "deduction-shield", targetId: SANKEY_IDS.taxes, value: part.payroll });
    }
    if (part.keep > 0) {
      s.links.push({ sourceId: "deduction-shield", targetId: SANKEY_IDS.keep, value: part.keep });
    }
  }

  if (poolTotal <= 0 && (result.takeHomePay > 0 || result.payrollTax > 0)) {
    if (result.payrollTax > 0) {
      s.links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: SANKEY_IDS.taxes, value: result.payrollTax });
    }
    if (result.takeHomePay > 0) {
      s.links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: SANKEY_IDS.keep, value: result.takeHomePay });
    }
  }
}
