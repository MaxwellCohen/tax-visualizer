import type { TaxResult } from "~/lib/taxForm.types";
import { getConfigItems } from "~/lib/config/page/Page.config";
import { chartMetricNumeric } from "~/lib/taxChartMetricRead";
import { getTaxYearConfig } from "~/lib/taxData";

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

export type MetricValueGetter = (result: TaxResult) => number | undefined;

export type MetricConfig = {
  id: string;
  label: string;
  getValue: MetricValueGetter;
  format: "currency" | "percent" | "number";
  highlight?: boolean;
  showWhen?: (result: TaxResult) => boolean;
  hideWhenZero?: boolean;
  displayOrder: number;
  category: "income" | "pretax" | "deduction" | "tax" | "credits" | "takehome" | "rate";
};

/** Default Tax Summary rows: derived from configItem `summary` hints (single ordering source). */
function buildDefaultMetricsConfig(): MetricConfig[] {
  const configs: MetricConfig[] = [];
  const taxData = getTaxYearConfig(2024);
  if (!taxData) return configs;
  const items = getConfigItems(taxData, "single");
  for (const item of items) {
    if (!item.summary) continue;
    const s = item.summary;
    configs.push({
      id: s.summaryId,
      label: s.label,
      getValue: (result: TaxResult) => {
        const line = result.metricLines?.find((l: any) => l.metricsKey === item.id);
        return typeof line?.value === "number" ? line.value : undefined;
      },
      format: s.format ?? "currency",
      displayOrder: s.displayOrder,
      category: s.category as any,
      highlight: s.highlight,
      hideWhenZero: s.hideWhenZero,
    });
  }
  configs.sort((a, b) => a.displayOrder - b.displayOrder);
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

  return metrics
    .filter((row) => {
      if (row.hideWhenZero) {
        const v = row.getValue(result);
        if (v == null || v <= 0) return false;
      }
      return !row.showWhen || row.showWhen(result);
    })
    .map((row) => {
      const value = row.getValue(result);
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

const FOOTNOTE_TEMPLATES: Record<string, (result: TaxResult) => string> = {
  "effective-rate-formula": () =>
    `(federal income tax + payroll tax + self-employment tax) / (gross income - payroll pre-tax - traditional IRA + net SE earnings)`,
  "take-home-formula": () =>
    `gross income - payroll pre-tax - federal income tax - payroll tax - self-employment tax - traditional IRA`,
  "pretax-breakdown": (result) => {
    const parts: string[] = [];
    if (chartMetricNumeric(result, "preTax401k") > 0) {
      parts.push(`401(k) ${currencyFormatter.format(chartMetricNumeric(result, "preTax401k"))}`);
    }
    if (chartMetricNumeric(result, "preTaxHsa") > 0) {
      parts.push(`HSA ${currencyFormatter.format(chartMetricNumeric(result, "preTaxHsa"))}`);
    }
    if (chartMetricNumeric(result, "preTaxOther") > 0) {
      parts.push(`other ${currencyFormatter.format(chartMetricNumeric(result, "preTaxOther"))}`);
    }
    if (chartMetricNumeric(result, "traditionalIra") > 0) {
      parts.push(`IRA ${currencyFormatter.format(chartMetricNumeric(result, "traditionalIra"))}`);
    }
    return parts.length > 0 ? parts.join(" · ") : "";
  },
  "federal-tax-breakdown": (result) => {
    const parts: string[] = [];
    parts.push(`ordinary ${currencyFormatter.format(chartMetricNumeric(result, "federalOrdinaryIncomeTax"))}`);
    parts.push(
      `long-term capital gain ${currencyFormatter.format(chartMetricNumeric(result, "federalLongTermCapGainsTax"))}`,
    );
    if (chartMetricNumeric(result, "federalNetInvestmentIncomeTax") > 0) {
      parts.push(`NIIT ${currencyFormatter.format(chartMetricNumeric(result, "federalNetInvestmentIncomeTax"))}`);
    }
    if (chartMetricNumeric(result, "selfEmploymentTax") > 0) {
      parts.push(`SE tax ${currencyFormatter.format(chartMetricNumeric(result, "selfEmploymentTax"))}`);
    }
    return parts.join(" · ");
  },
  "taxable-income-breakdown": (result) => {
    const parts: string[] = [];
    parts.push(`ordinary ${currencyFormatter.format(chartMetricNumeric(result, "ordinaryTaxableIncome"))}`);
    parts.push(`taxable LTCG ${currencyFormatter.format(chartMetricNumeric(result, "longTermTaxableIncome"))}`);
    return parts.join(" · ");
  },
  "payroll-breakdown": (result) => {
    const parts: string[] = [];
    parts.push(`Social Security ${currencyFormatter.format(chartMetricNumeric(result, "socialSecurityTax"))}`);
    if (chartMetricNumeric(result, "selfEmploymentTax") > 0) {
      const se = chartMetricNumeric(result, "selfEmploymentTax");
      parts.push(`SE ${currencyFormatter.format(se)}`);
    }
    parts.push(`Medicare ${currencyFormatter.format(chartMetricNumeric(result, "medicareTax"))}`);
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

  return footnotes
    .map((f) => ({
      id: f.id,
      text: FOOTNOTE_TEMPLATES[f.templateKey]?.(result) ?? "",
      displayOrder: f.displayOrder,
    }))
    .filter((f) => f.text)
    .sort((a, b) => a.displayOrder - b.displayOrder);
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
  baseline: TaxResult,
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
  baseline: TaxResult,
): { diff: number; isPositive: boolean } {
  switch (metricId) {
    case "take-home-pay": {
      const takeHomeDiff =
        chartMetricNumeric(result, "takeHomePay") - chartMetricNumeric(baseline, "takeHomePay");
      return { diff: takeHomeDiff, isPositive: takeHomeDiff > 0 };
    }
    case "federal-income-tax": {
      const fedDiff =
        chartMetricNumeric(result, "federalIncomeTax") - chartMetricNumeric(baseline, "federalIncomeTax");
      return { diff: fedDiff, isPositive: fedDiff < 0 };
    }
    case "payroll-tax": {
      const payrollDiff = chartMetricNumeric(result, "payrollTax") - chartMetricNumeric(baseline, "payrollTax");
      return { diff: payrollDiff, isPositive: payrollDiff < 0 };
    }
    default:
      return { diff: 0, isPositive: false };
  }
}
