import type { TaxResult } from "~/lib/taxForm.types";
import type { TaxChartMetrics } from "~/lib/taxForm.types";
import { resolveTaxChartMetrics } from "~/lib/taxResult.resolve";
import type { VisualizationConfig, VisualizationMetric, VisualizationFootnote } from "~/lib/taxConfig.types";
import {
  INCOME_KIND_CONFIGS,
  PRETAX_BENEFIT_CONFIGS,
  FEDERAL_CREDIT_CONFIGS,
} from "~/lib/config/taxItems";
import {
  chartMetricNumeric,
  INCOME_AGGREGATION_FIELD_TO_CHART_METRIC_KEY,
  pretaxKindIdToChartMetricKey,
  VISUALIZATION_METRIC_ID_TO_CHART_KEY,
} from "~/lib/config/pipelineTaxResult.config";

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

export type MetricValueGetter = (m: TaxChartMetrics) => number | undefined;

export type MetricConfig = {
  id: string;
  label: string;
  getValue: MetricValueGetter;
  format: "currency" | "percent" | "number";
  highlight?: boolean;
  showWhen?: (m: TaxChartMetrics) => boolean;
  displayOrder: number;
  category: "income" | "pretax" | "deduction" | "tax" | "credits" | "takehome" | "rate";
};

function visualizationMetricGetter(id: string): (m: TaxChartMetrics) => number {
  const chartKey = VISUALIZATION_METRIC_ID_TO_CHART_KEY[id] ?? id;
  return (m) => chartMetricNumeric(m, chartKey as keyof TaxChartMetrics);
}

function mapCategoryToMetricCategory(category: string): MetricConfig["category"] {
  const map: Record<string, MetricConfig["category"]> = {
    income: "income",
    pretax: "pretax",
    deduction: "deduction",
    tax: "tax",
    credit: "credits",
    summary: "takehome",
  };
  return map[category] ?? "income";
}

function buildMetricConfig(
  id: string,
  getValue: (m: TaxChartMetrics) => number,
  label: string,
  category: string,
  order: number,
  options?: { highlight?: boolean; showWhen?: (m: TaxChartMetrics) => boolean; format?: "currency" | "percent" | "number" },
): MetricConfig {
  return {
    id,
    label,
    getValue,
    format: options?.format ?? "currency",
    displayOrder: order,
    category: mapCategoryToMetricCategory(category),
    highlight: options?.highlight,
    showWhen: options?.showWhen,
  };
}

export function buildDefaultMetricsConfig(): MetricConfig[] {
  const configs: MetricConfig[] = [];
  let order = 1;

  for (const cfg of INCOME_KIND_CONFIGS) {
    const chartKey = INCOME_AGGREGATION_FIELD_TO_CHART_METRIC_KEY[cfg.aggregationField as keyof typeof INCOME_AGGREGATION_FIELD_TO_CHART_METRIC_KEY];
    configs.push(
      buildMetricConfig(cfg.id, (m) => chartMetricNumeric(m, chartKey), cfg.label, "income", order++),
    );
  }
  configs.push(buildMetricConfig("total-income", visualizationMetricGetter("total-income"), "Total Income", "income", order++));

  for (const cfg of PRETAX_BENEFIT_CONFIGS) {
    const metricId =
      cfg.id === "401k" ? "preTax401k" : cfg.id === "hsa" ? "preTaxHsa" : cfg.id === "other" ? "preTaxOther" : cfg.id;
    const chartKey = pretaxKindIdToChartMetricKey(cfg.id);
    configs.push(buildMetricConfig(metricId, (m) => chartMetricNumeric(m, chartKey), cfg.label, "pretax", order++));
  }
  configs.push(buildMetricConfig("wages-after-pretax", visualizationMetricGetter("wages-after-pretax"), "Wages After Pre-tax", "pretax", order++));

  configs.push(buildMetricConfig("standard-deduction", visualizationMetricGetter("standard-deduction"), "Standard Deduction", "deduction", order++));
  configs.push(buildMetricConfig("deduction-amount", visualizationMetricGetter("deduction-amount"), "Deduction Used", "deduction", order++));

  configs.push(buildMetricConfig("ordinary-taxable-income", visualizationMetricGetter("ordinary-taxable-income"), "Ordinary Taxable", "income", order++));
  configs.push(buildMetricConfig("long-term-taxable-income", visualizationMetricGetter("long-term-taxable-income"), "LTCG Taxable", "income", order++));

  configs.push(buildMetricConfig("federal-ordinary-tax", visualizationMetricGetter("federal-ordinary-tax"), "Federal Ord. Tax", "tax", order++));
  configs.push(buildMetricConfig("federal-ltcg-tax", visualizationMetricGetter("federal-ltcg-tax"), "Federal LTCG Tax", "tax", order++));
  configs.push(buildMetricConfig("federal-niit", visualizationMetricGetter("federal-niit"), "Net Investment Income Tax", "tax", order++));
  configs.push(buildMetricConfig("federal-income-tax", visualizationMetricGetter("federal-income-tax"), "Federal Income Tax", "tax", order++));
  configs.push(buildMetricConfig("federal-income-tax-before-credits", visualizationMetricGetter("federal-income-tax-before-credits"), "Fed Tax Before Credits", "tax", order++));

  for (const cfg of FEDERAL_CREDIT_CONFIGS) {
    const id = `${cfg.aggregationField}Credit`;
    configs.push(buildMetricConfig(id, (m) => (m as unknown as Record<string, number>)[cfg.aggregationField] ?? 0, cfg.label, "credits", order++));
  }

  configs.push(buildMetricConfig("social-security-tax", visualizationMetricGetter("social-security-tax"), "Social Security Tax", "tax", order++));
  configs.push(buildMetricConfig("medicare-tax", visualizationMetricGetter("medicare-tax"), "Medicare Tax", "tax", order++));
  configs.push(buildMetricConfig("payroll-tax", visualizationMetricGetter("payroll-tax"), "Payroll Taxes", "tax", order++));

  configs.push(buildMetricConfig("take-home-pay", visualizationMetricGetter("take-home-pay"), "Take-Home Pay", "summary", order++, { highlight: true }));
  configs.push(buildMetricConfig("effective-rate", visualizationMetricGetter("effective-rate"), "Effective Tax Rate", "rate", order++, { highlight: true, format: "percent" }));
  configs.push(buildMetricConfig("marginal-rate", (m) => {
    const ord = m.ordinaryFederalSegments;
    if (ord && ord.length > 0) return ord[ord.length - 1].marginalRate;
    return 0;
  }, "Marginal Rate", "rate", order++, { format: "percent" }));

  return configs;
}

const DEFAULT_METRICS: MetricConfig[] = buildDefaultMetricsConfig();

export type MetricDisplay = {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
  category: MetricConfig["category"];
  displayOrder: number;
};

export function computeMetrics(result: TaxResult, config?: MetricConfig[]): MetricDisplay[] {
  const metrics = config ?? DEFAULT_METRICS;
  const chart = resolveTaxChartMetrics(result);

  return metrics
    .filter((row) => !row.showWhen || row.showWhen(chart))
    .map((row) => {
      const value = row.getValue(chart);
      const formatted = formatValue(value, row.format);
      return {
        id: row.id,
        label: row.label,
        value: formatted,
        highlight: row.highlight,
        category: row.category,
        displayOrder: row.displayOrder,
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function formatValue(value: number | undefined, format: "currency" | "percent" | "number"): string {
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

export const FOOTNOTE_TEMPLATES: Record<string, (m: TaxChartMetrics) => string> = {
  "effective-rate-formula": () => `(federal income tax + payroll tax + self-employment tax) / (gross income - payroll pre-tax - traditional IRA + net SE earnings)`,
  "take-home-formula": () => `gross income - payroll pre-tax - federal income tax - payroll tax - self-employment tax - traditional IRA`,
  "pretax-breakdown": (m) => {
    const parts: string[] = [];
    if (m.preTax401k > 0) parts.push(`401(k) ${currencyFormatter.format(m.preTax401k)}`);
    if (m.preTaxHsa > 0) parts.push(`HSA ${currencyFormatter.format(m.preTaxHsa)}`);
    if (m.preTaxOther > 0) parts.push(`other ${currencyFormatter.format(m.preTaxOther)}`);
    if (m.traditionalIra > 0) parts.push(`IRA ${currencyFormatter.format(m.traditionalIra)}`);
    return parts.length > 0 ? parts.join(" · ") : "";
  },
  "federal-tax-breakdown": (m) => {
    const parts: string[] = [];
    parts.push(`ordinary ${currencyFormatter.format(m.federalOrdinaryIncomeTax)}`);
    parts.push(`long-term capital gain ${currencyFormatter.format(m.federalLongTermCapGainsTax)}`);
    if (m.federalNetInvestmentIncomeTax > 0) parts.push(`NIIT ${currencyFormatter.format(m.federalNetInvestmentIncomeTax)}`);
    if (m.selfEmploymentTax > 0) parts.push(`SE tax ${currencyFormatter.format(m.selfEmploymentTax)}`);
    return parts.join(" · ");
  },
  "taxable-income-breakdown": (m) => {
    const parts: string[] = [];
    parts.push(`ordinary ${currencyFormatter.format(m.ordinaryTaxableIncome)}`);
    parts.push(`taxable LTCG ${currencyFormatter.format(m.longTermTaxableIncome)}`);
    return parts.join(" · ");
  },
  "payroll-breakdown": (m) => {
    const parts: string[] = [];
    parts.push(`Social Security ${currencyFormatter.format(m.socialSecurityTax)}`);
    if (m.selfEmploymentTax > 0) {
      const se = m.selfEmploymentTax;
      const seBase = se - (m.medicareTax * 2); 
      parts.push(`SE ${currencyFormatter.format(se)}`);
    }
    parts.push(`Medicare ${currencyFormatter.format(m.medicareTax)}`);
    return parts.join(" + ");
  },
};

export type FootnoteConfig = {
  id: string;
  templateKey: string;
  displayOrder: number;
};

const DEFAULT_FOOTNOTES: FootnoteConfig[] = [
  { id: "effective-rate-formula", templateKey: "effective-rate-formula", displayOrder: 1 },
  { id: "take-home-formula", templateKey: "take-home-formula", displayOrder: 2 },
];

export type FootnoteDisplay = {
  id: string;
  text: string;
  displayOrder: number;
};

export function computeFootnotes(result: TaxResult, config?: FootnoteConfig[]): FootnoteDisplay[] {
  const footnotes = config ?? DEFAULT_FOOTNOTES;
  const chart = resolveTaxChartMetrics(result);

  return footnotes
    .map((f) => ({
      id: f.id,
      text: FOOTNOTE_TEMPLATES[f.templateKey]?.(chart) ?? "",
      displayOrder: f.displayOrder,
    }))
    .filter((f) => f.text)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getMetricByCategory(result: TaxResult, category: MetricConfig["category"]): MetricDisplay[] {
  return computeMetrics(result).filter((m) => m.category === category);
}

export function getHighlightedMetrics(result: TaxResult): MetricDisplay[] {
  return computeMetrics(result).filter((m) => m.highlight);
}

export function getBaselineComparison(
  result: TaxResult,
  baseline: TaxResult | null,
  metrics?: MetricConfig[],
): Array<{ id: string; label: string; currentValue: string; delta?: string; isPositiveDelta?: boolean }> {
  if (!baseline) return [];
  
  const currentMetrics = computeMetrics(result, metrics);
  const baselineMetrics = computeMetrics(baseline, metrics);
  
  return currentMetrics
    .filter((m) => ["take-home-pay", "federal-income-tax", "payroll-tax"].includes(m.id))
    .map((m) => computeBaselineComparison(m, baselineMetrics, result, baseline));
}

function computeBaselineComparison(
  m: MetricDisplay,
  baselineMetrics: MetricDisplay[],
  result: TaxResult,
  baseline: TaxResult
) {
  const baselineMetric = baselineMetrics.find((bm) => bm.id === m.id);
  const currentValue = m.value;
  let delta: string | undefined;
  let isPositiveDelta: boolean | undefined;

  if (!baselineMetric) {
    return { id: m.id, label: m.label, currentValue, delta, isPositiveDelta };
  }

  const comparison = calculateDelta(m.id, result, baseline);
  if (comparison.diff !== 0) {
    delta = (comparison.diff > 0 ? "+" : "") + currencyFormatter.format(comparison.diff);
    isPositiveDelta = comparison.isPositive;
  }

  return { id: m.id, label: m.label, currentValue, delta, isPositiveDelta };
}

function calculateDelta(
  metricId: string,
  result: TaxResult,
  baseline: TaxResult
): { diff: number; isPositive: boolean } {
  const r = resolveTaxChartMetrics(result);
  const b = resolveTaxChartMetrics(baseline);
  switch (metricId) {
    case "take-home-pay":
      const takeHomeDiff = r.takeHomePay - b.takeHomePay;
      return { diff: takeHomeDiff, isPositive: takeHomeDiff > 0 };
    case "federal-income-tax":
      const fedDiff = r.federalIncomeTax - b.federalIncomeTax;
      return { diff: fedDiff, isPositive: fedDiff < 0 };
    case "payroll-tax":
      const payrollDiff = r.payrollTax - b.payrollTax;
      return { diff: payrollDiff, isPositive: payrollDiff < 0 };
    default:
      return { diff: 0, isPositive: false };
  }
}