import type { ChartNode } from "~/components/taxSankey/chartTypes";
import { sankeyMoney } from "~/components/taxSankey/sankeyFormat";

export type SankeyLabelLines = {
  title: string;
  compact: boolean;
  line1: string;
  line2?: string;
};

function isBracketNode(node: ChartNode): boolean {
  return node.kind === "ordinaryBracket" || node.kind === "ltcgBracket";
}

function nodeFlowValue(node: ChartNode): number {
  return node.amount ?? node.value ?? 0;
}

function compactNodeLabel(node: ChartNode): string {
  if (node.kind === "deferredSink") {
    if (node.label.includes("401(k)")) return "401(k)";
    if (node.label.includes("HSA")) return "HSA";
    if (node.label.includes("IRA")) return "IRA";
    if (node.label.includes("Other")) return "Other";
  }

  if (node.kind === "pretaxContribution") {
    if (node.label === "Other pre-tax") return "Other";
    if (node.label.includes("IRA")) return "IRA";
  }

  return node.label;
}

export function sankeyLabelLines(node: ChartNode): SankeyLabelLines {
  const money = sankeyMoney;
  const flow = nodeFlowValue(node);
  const fmt = money.format(flow);
  const y0 = node.y0 ?? 0;
  const y1 = node.y1 ?? 0;
  const h = Math.max(0, y1 - y0);

  if (node.kind === "standardDeduction") {
    const title = `${node.label} for this filing status is ${fmt}. The flow through this bar is your itemized amount (next step), so band width matches itemized dollars, not this benchmark.`;
    if (h < 30) {
      return { compact: true, title, line1: `Std · ${fmt}` };
    }
    return { compact: false, title, line1: "Standard (benchmark)", line2: fmt };
  }

  if (isBracketNode(node)) {
    const slice = node.incomeAmount ?? flow;
    const tax = node.taxAmount ?? 0;
    const net = Math.max(0, slice - tax);
    const sliceFmt = money.format(slice);
    const ratePct = Math.round((node.marginalRate ?? 0) * 100);
    const line1 = node.kind === "ltcgBracket" ? `LTCG ${ratePct}%` : `${ratePct}%`;
    const title = `${node.label}. This slice ${sliceFmt}; federal tax ${money.format(tax)}; ${money.format(net)} net of this bracket (before payroll).`;
    if (h < 34) {
      return { compact: true, title, line1: `${line1} · ${sliceFmt}` };
    }
    return { compact: false, title, line1, line2: sliceFmt };
  }

  const title = `${node.label}, ${fmt}`;
  if (h < 28) {
    return { compact: true, title, line1: `${compactNodeLabel(node)} · ${fmt}` };
  }
  return { compact: false, title, line1: compactNodeLabel(node), line2: fmt };
}
