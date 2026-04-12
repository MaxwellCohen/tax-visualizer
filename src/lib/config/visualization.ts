import type { TaxCalculationState, TaxItemResult } from "~/lib/taxConfig.types";
import { TAX_ITEM_CALCS, getEnabledTaxItemCalcs, type TaxItemOutput } from "./taxItems";

export type MetricConfig = {
  id: string;
  label: string;
  getValue: (state: TaxCalculationState) => number | undefined;
  format: "currency" | "percent" | "number";
  displayOrder: number;
  highlight?: boolean;
  showWhen?: (state: TaxCalculationState) => boolean;
  category: "income" | "pretax" | "deduction" | "tax" | "credits" | "takehome" | "rate";
};

export type SankeyNodeConfig = {
  id: string;
  kind: string;
  order: number;
  label: string;
  category: "income" | "deduction" | "tax" | "keep" | "pretax";
  showWhen?: (state: TaxCalculationState) => boolean;
};

export type FootnoteConfig = {
  id: string;
  template: (state: TaxCalculationState) => string;
  displayOrder: number;
};

export type VisualizationConfig = {
  metrics: MetricConfig[];
  sankeyNodes: SankeyNodeConfig[];
  footnotes: FootnoteConfig[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function getValueFromState(state: TaxCalculationState, key: string): number | undefined {
  for (const item of TAX_ITEM_CALCS) {
    const result = state.results.get(item.id);
    if (result) {
      if (result.amount !== undefined && item.id === key) {
        return result.amount;
      }
      if (result.metadata && key in result.metadata) {
        return result.metadata[key] as number;
      }
    }
  }
  return undefined;
}

function getOutputValue(state: TaxCalculationState, output: TaxItemOutput): number | undefined {
  if (output.key === "totalIncome") {
    return state.results.get("income-aggregation")?.amount;
  }
  if (output.key === "preTaxTotal") {
    return state.results.get("pretax-benefits")?.amount;
  }
  if (output.key === "deductionAmount") {
    return state.results.get("deduction-calculation")?.amount;
  }
  if (output.key === "federalOrdinaryIncomeTax") {
    return state.results.get("federal-ordinary-tax")?.amount;
  }
  if (output.key === "federalLongTermCapGainsTax") {
    return state.results.get("federal-ltcg-tax")?.amount;
  }
  if (output.key === "federalNetInvestmentIncomeTax") {
    return state.results.get("federal-niit")?.amount;
  }
  if (output.key === "federalTaxCreditsApplied") {
    return state.results.get("tax-credits")?.amount;
  }
  if (output.key === "payrollTax") {
    return state.results.get("payroll-tax")?.amount;
  }
  if (output.key === "takeHomePay") {
    return state.results.get("take-home-calculation")?.amount;
  }
  
  for (const item of TAX_ITEM_CALCS) {
    const result = state.results.get(item.id);
    if (result?.metadata && output.key in result.metadata) {
      return result.metadata[output.key] as number;
    }
  }
  
  return undefined;
}

export function generateVisualizationConfig(state?: TaxCalculationState): VisualizationConfig {
  const metrics: MetricConfig[] = [];
  const sankeyNodes: SankeyNodeConfig[] = [];
  
  let metricOrder = 1;
  let nodeOrder = 0;
  
  for (const item of getEnabledTaxItemCalcs()) {
    for (const output of item.outputs) {
      if (state && output.showWhen && !output.showWhen(state)) {
        continue;
      }
      
      metrics.push({
        id: output.key,
        label: output.label,
        getValue: (s) => getOutputValue(s, output),
        format: output.type,
        displayOrder: metricOrder++,
        highlight: output.highlight,
        showWhen: output.showWhen,
        category: getMetricCategory(item),
      });
      
      if (output.sankeyNodeKind) {
        sankeyNodes.push({
          id: output.key,
          kind: output.sankeyNodeKind,
          order: nodeOrder++,
          label: output.label,
          category: output.chartCategory ?? getSankeyCategory(item),
          showWhen: output.showWhen,
        });
      }
    }
  }
  
  const footnotes = createDefaultFootnotes();
  
  return { metrics, sankeyNodes, footnotes };
}

function getMetricCategory(item: { id: string; category: string }): MetricConfig["category"] {
  switch (item.category) {
    case "income":
      return item.id === "take-home-calculation" ? "takehome" : "income";
    case "pretax":
      return "pretax";
    case "deduction":
      return "deduction";
    case "credit":
      return "credits";
    case "tax":
      return "tax";
    default:
      return "income";
  }
}

function getSankeyCategory(item: { id: string; category: string }): SankeyNodeConfig["category"] {
  switch (item.category) {
    case "income":
      return "income";
    case "pretax":
      return "income";
    case "deduction":
      return "deduction";
    case "credit":
      return "tax";
    case "tax":
      return "tax";
    default:
      return "income";
  }
}

function createDefaultFootnotes(): FootnoteConfig[] {
  return [
    {
      id: "effective-rate-formula",
      template: () => "(federal income tax + payroll tax) / (gross income - payroll pre-tax - traditional IRA)",
      displayOrder: 1,
    },
    {
      id: "take-home-formula",
      template: () => "gross income - payroll pre-tax - federal income tax - payroll tax - traditional IRA",
      displayOrder: 2,
    },
  ];
}

export function formatMetricValue(value: number | undefined, format: "currency" | "percent" | "number"): string {
  if (value === undefined || value === null) return "-";
  switch (format) {
    case "currency":
      return currencyFormatter.format(value);
    case "percent":
      return percentFormatter.format(value);
    case "number":
      return new Intl.NumberFormat("en-US").format(value);
  }
}

export function computeMetrics(state: TaxCalculationState, config?: VisualizationConfig): Array<{
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
  category: MetricConfig["category"];
  displayOrder: number;
}> {
  const visConfig = config ?? generateVisualizationConfig(state);
  
  return visConfig.metrics
    .filter((m) => !m.showWhen || m.showWhen(state))
    .map((m) => ({
      id: m.id,
      label: m.label,
      value: formatMetricValue(m.getValue(state), m.format),
      highlight: m.highlight,
      category: m.category,
      displayOrder: m.displayOrder,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getHighlightedMetrics(state: TaxCalculationState): Array<{
  id: string;
  label: string;
  value: string;
}> {
  return computeMetrics(state)
    .filter((m) => m.highlight)
    .map(({ id, label, value }) => ({ id, label, value }));
}

export function getMetricsByCategory(state: TaxCalculationState, category: MetricConfig["category"]): Array<{
  id: string;
  label: string;
  value: string;
}> {
  return computeMetrics(state).filter((m) => m.category === category);
}