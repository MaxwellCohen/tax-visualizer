import type { ChartNode } from "~/components/taxSankey/chartTypes";
import { sankeyMoney } from "~/components/taxSankey/sankeyFormat";

type SankeyLabelLines = {
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
  const h = getNodeHeight(node);

  const labelLines = getLabelLinesForNode(node, money, flow, fmt, h);
  if (labelLines) return labelLines;

  return createDefaultLabelLines(node, fmt, h);
}

function getNodeHeight(node: ChartNode): number {
  const y0 = node.y0 ?? 0;
  const y1 = node.y1 ?? 0;
  return Math.max(0, y1 - y0);
}

function getLabelLinesForNode(node: ChartNode, money: typeof sankeyMoney, flow: number, fmt: string, h: number): SankeyLabelLines | null {
  switch (node.kind) {
    case "payrollOrdinaryStrip":
      return createPayrollLabel(fmt, h);
    case "taxesFederal":
      return createFederalTaxLabel(fmt, h);
    case "taxesPayroll":
      return createPayrollTaxLabel(fmt, h);
    case "federalCredits":
      return createCreditsLabel(node, fmt, h);
    case "deductionBenefitSink":
      return createDeductionLabel(fmt, h);
    case "standardDeduction":
      return createStandardDeductionLabel(node, fmt, h);
    default:
      if (isBracketNode(node)) {
        return createBracketLabel(node, money, flow, h);
      }
      return null;
  }
}

function createPayrollLabel(fmt: string, h: number): SankeyLabelLines {
  const title = `Payroll tax (Social Security and Medicare on wages). Shown beside ordinary brackets; width matches dollars flowing to payroll tax. ${fmt}.`;
  if (h < 28) return { compact: true, title, line1: `Payroll · ${fmt}` };
  return { compact: false, title, line1: "Payroll taxes", line2: fmt };
}

function createFederalTaxLabel(fmt: string, h: number): SankeyLabelLines {
  const title = `Federal income tax and net investment income tax (NIIT), net of credits modeled here. Total ${fmt}.`;
  if (h < 28) return { compact: true, title, line1: `Federal · ${fmt}` };
  return { compact: false, title, line1: "Federal tax", line2: fmt };
}

function createPayrollTaxLabel(fmt: string, h: number): SankeyLabelLines {
  const title = `Employee Social Security, Medicare, and additional Medicare on W-2 wages (after pre-tax deferrals). Total ${fmt}.`;
  if (h < 28) return { compact: true, title, line1: `Payroll · ${fmt}` };
  return { compact: false, title, line1: "Payroll tax", line2: fmt };
}

function createCreditsLabel(node: ChartNode, fmt: string, h: number): SankeyLabelLines {
  const title = `${node.label}: ${fmt} of federal income tax offset (nonrefundable credits), flowing to take-home.`;
  if (h < 28) return { compact: true, title, line1: `Credits · ${fmt}` };
  return { compact: false, title, line1: "Fed. credits", line2: fmt };
}

function createDeductionLabel(fmt: string, h: number): SankeyLabelLines {
  const title = `Itemized deduction shields ${fmt} of income from tax. This is not an extra cash inflow—the bar reflects deductions you already incurred or claimed.`;
  if (h < 28) return { compact: true, title, line1: `Itemized shield · ${fmt}` };
  return { compact: false, title, line1: "Itemized shield", line2: fmt };
}

function createStandardDeductionLabel(node: ChartNode, fmt: string, h: number): SankeyLabelLines {
  const title = `${node.label} for this filing status is ${fmt}. The flow through this bar is your itemized amount (next step), so band width matches itemized dollars, not this benchmark.`;
  if (h < 30) return { compact: true, title, line1: `Std · ${fmt}` };
  return { compact: false, title, line1: "Standard (benchmark)", line2: fmt };
}

function createBracketLabel(node: ChartNode, money: typeof sankeyMoney, flow: number, h: number): SankeyLabelLines {
  const slice = node.incomeAmount ?? flow;
  const tax = node.taxAmount ?? 0;
  const net = Math.max(0, slice - tax);
  const sliceFmt = money.format(slice);
  const ratePct = Math.round((node.marginalRate ?? 0) * 100);
  const line1 = node.kind === "ltcgBracket" ? `LTCG ${ratePct}%` : `${ratePct}%`;
  const title = `${node.label}. This slice ${sliceFmt}; federal tax ${money.format(tax)}; ${money.format(net)} net of this bracket (before payroll).`;
  if (h < 34) return { compact: true, title, line1: `${line1} · ${sliceFmt}` };
  return { compact: false, title, line1, line2: sliceFmt };
}

function createDefaultLabelLines(node: ChartNode, fmt: string, h: number): SankeyLabelLines {
  const title = `${node.label}, ${fmt}`;
  if (h < 28) return { compact: true, title, line1: `${compactNodeLabel(node)} · ${fmt}` };
  return { compact: false, title, line1: compactNodeLabel(node), line2: fmt };
}
