import type { TaxResult } from "~/lib/taxCalc";
import type { VisualizationConfig, VisualizationMetric, VisualizationFootnote } from "~/lib/taxConfig.types";

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
  displayOrder: number;
  category: "income" | "pretax" | "deduction" | "tax" | "credits" | "takehome" | "rate";
};

const DEFAULT_METRICS: MetricConfig[] = [
  { id: "total-income", label: "Total Income", getValue: (r) => r.totalIncome, format: "currency", displayOrder: 1, category: "income" },
  { id: "wage-income", label: "W-2 Wages", getValue: (r) => r.wageIncome, format: "currency", displayOrder: 1.5, category: "income" },
  { id: "self-employment-income", label: "1099 Self-Employment", getValue: (r) => r.selfEmploymentIncome, format: "currency", displayOrder: 1.7, category: "income", showWhen: (r) => (r.selfEmploymentIncome ?? 0) > 0 },
  { id: "ordinary-income", label: "Ordinary Income", getValue: (r) => r.ordinaryGrossIncome, format: "currency", displayOrder: 1.8, category: "income", showWhen: (r) => r.ordinaryGrossIncome > 0 },
  { id: "short-term-cap-gains", label: "Short-Term Cap Gains", getValue: (r) => r.shortTermCapGainsGrossIncome, format: "currency", displayOrder: 1.9, category: "income", showWhen: (r) => r.shortTermCapGainsGrossIncome > 0 },
  { id: "long-term-cap-gains", label: "Long-Term Cap Gains", getValue: (r) => r.longTermCapitalGainsGrossIncome, format: "currency", displayOrder: 2, category: "income", showWhen: (r) => r.longTermCapitalGainsGrossIncome > 0 },
  { id: "pre-tax-total", label: "Payroll pre-tax", getValue: (r) => r.preTaxTotal, format: "currency", displayOrder: 3, category: "pretax" },
  { id: "pre-tax-401k", label: "401(k) Deferrals", getValue: (r) => r.preTax401k, format: "currency", displayOrder: 3.1, category: "pretax", showWhen: (r) => r.preTax401k > 0 },
  { id: "pre-tax-hsa", label: "HSA (payroll)", getValue: (r) => r.preTaxHsa, format: "currency", displayOrder: 3.2, category: "pretax", showWhen: (r) => r.preTaxHsa > 0 },
  { id: "pre-tax-other", label: "Other Pre-tax", getValue: (r) => r.preTaxOther, format: "currency", displayOrder: 3.3, category: "pretax", showWhen: (r) => r.preTaxOther > 0 },
  { id: "traditional-ira", label: "Traditional IRA", getValue: (r) => r.traditionalIra, format: "currency", displayOrder: 4, category: "pretax", showWhen: (r) => r.traditionalIra > 0 },
  { id: "wages-after-pretax", label: "Wages After Pre-tax", getValue: (r) => r.wagesAfterPretax, format: "currency", displayOrder: 4.5, category: "pretax", showWhen: (r) => r.wagesAfterPretax > 0 },
  { id: "standard-deduction", label: "Standard Deduction", getValue: (r) => r.standardDeduction, format: "currency", displayOrder: 5, category: "deduction" },
  { id: "deduction-amount", label: "Deduction Used", getValue: (r) => r.deductionAmount, format: "currency", displayOrder: 5.5, category: "deduction", showWhen: (r) => r.deductionAmount > 0 },
  { id: "deduction-kind", label: "Deduction Type", getValue: (r) => r.deductionKind === "itemized" ? 1 : 0, format: "number", displayOrder: 5.6, category: "deduction" },
  { id: "ordinary-taxable-income", label: "Ordinary Taxable", getValue: (r) => r.ordinaryTaxableIncome, format: "currency", displayOrder: 6, category: "income" },
  { id: "long-term-taxable-income", label: "LTCG Taxable", getValue: (r) => r.longTermTaxableIncome, format: "currency", displayOrder: 6.5, category: "income", showWhen: (r) => r.longTermTaxableIncome > 0 },
  { id: "federal-ordinary-tax", label: "Federal Ord. Tax", getValue: (r) => r.federalOrdinaryIncomeTax, format: "currency", displayOrder: 7, category: "tax" },
  { id: "federal-ltcg-tax", label: "Federal LTCG Tax", getValue: (r) => r.federalLongTermCapGainsTax, format: "currency", displayOrder: 7.5, category: "tax", showWhen: (r) => r.federalLongTermCapGainsTax > 0 },
  { id: "federal-niit", label: "Net Investment Income Tax", getValue: (r) => r.federalNetInvestmentIncomeTax, format: "currency", displayOrder: 7.6, category: "tax", showWhen: (r) => r.federalNetInvestmentIncomeTax > 0 },
  { id: "federal-income-tax", label: "Federal Income Tax", getValue: (r) => r.federalIncomeTax, format: "currency", displayOrder: 8, category: "tax" },
  { id: "federal-income-tax-before-credits", label: "Fed Tax Before Credits", getValue: (r) => r.federalIncomeTaxBeforeCredits, format: "currency", displayOrder: 8.1, category: "tax" },
  { id: "self-employment-tax", label: "Self-Employment Tax", getValue: (r) => r.selfEmploymentTax, format: "currency", displayOrder: 8.5, category: "tax", showWhen: (r) => (r.selfEmploymentTax ?? 0) > 0 },
  { id: "federal-credits-entered", label: "Fed Credits Entered", getValue: (r) => r.federalTaxCredits, format: "currency", displayOrder: 9, category: "credits", showWhen: (r) => r.federalTaxCredits > 0 },
  { id: "federal-credits-applied", label: "Fed Credits Applied", getValue: (r) => r.federalTaxCreditsApplied, format: "currency", displayOrder: 9.5, category: "credits", showWhen: (r) => r.federalTaxCreditsApplied > 0 },
  { id: "social-security-tax", label: "Social Security Tax", getValue: (r) => r.socialSecurityTax, format: "currency", displayOrder: 10, category: "tax" },
  { id: "medicare-tax", label: "Medicare Tax", getValue: (r) => r.medicareTax, format: "currency", displayOrder: 10.5, category: "tax" },
  { id: "payroll-tax", label: "Payroll Taxes", getValue: (r) => r.payrollTax, format: "currency", displayOrder: 11, category: "tax" },
  { id: "take-home-pay", label: "Take-Home Pay", getValue: (r) => r.takeHomePay, format: "currency", highlight: true, displayOrder: 12, category: "takehome" },
  { id: "effective-rate", label: "Effective Tax Rate", getValue: (r) => r.effectiveTaxRate, format: "percent", highlight: true, displayOrder: 13, category: "rate" },
  { id: "marginal-rate", label: "Marginal Rate", getValue: (r) => {
    const ord = r.ordinaryFederalSegments;
    if (ord.length > 0) return ord[ord.length - 1].marginalRate;
    return r.longTermCapitalGainsSegments.length > 0 ? r.longTermCapitalGainsSegments[r.longTermCapitalGainsSegments.length - 1].marginalRate : 0;
  }, format: "percent", displayOrder: 14, category: "rate" },
];

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
    .filter((m) => !m.showWhen || m.showWhen(result))
    .map((m) => {
      const value = m.getValue(result);
      const formatted = formatValue(value, m.format);
      return {
        id: m.id,
        label: m.label,
        value: formatted,
        highlight: m.highlight,
        category: m.category,
        displayOrder: m.displayOrder,
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

export const FOOTNOTE_TEMPLATES: Record<string, (result: TaxResult) => string> = {
  "effective-rate-formula": () => `(federal income tax + payroll tax + self-employment tax) / (gross income - payroll pre-tax - traditional IRA + net SE earnings)`,
  "take-home-formula": () => `gross income - payroll pre-tax - federal income tax - payroll tax - self-employment tax - traditional IRA`,
  "pretax-breakdown": (r) => {
    const parts: string[] = [];
    if (r.preTax401k > 0) parts.push(`401(k) ${currencyFormatter.format(r.preTax401k)}`);
    if (r.preTaxHsa > 0) parts.push(`HSA ${currencyFormatter.format(r.preTaxHsa)}`);
    if (r.preTaxOther > 0) parts.push(`other ${currencyFormatter.format(r.preTaxOther)}`);
    if (r.traditionalIra > 0) parts.push(`IRA ${currencyFormatter.format(r.traditionalIra)}`);
    return parts.length > 0 ? parts.join(" · ") : "";
  },
  "federal-tax-breakdown": (r) => {
    const parts: string[] = [];
    parts.push(`ordinary ${currencyFormatter.format(r.federalOrdinaryIncomeTax)}`);
    parts.push(`long-term capital gain ${currencyFormatter.format(r.federalLongTermCapGainsTax)}`);
    if (r.federalNetInvestmentIncomeTax > 0) parts.push(`NIIT ${currencyFormatter.format(r.federalNetInvestmentIncomeTax)}`);
    if (r.selfEmploymentTax > 0) parts.push(`SE tax ${currencyFormatter.format(r.selfEmploymentTax)}`);
    return parts.join(" · ");
  },
  "taxable-income-breakdown": (r) => {
    const parts: string[] = [];
    parts.push(`ordinary ${currencyFormatter.format(r.ordinaryTaxableIncome)}`);
    parts.push(`taxable LTCG ${currencyFormatter.format(r.longTermTaxableIncome)}`);
    return parts.join(" · ");
  },
  "payroll-breakdown": (r) => {
    const parts: string[] = [];
    parts.push(`Social Security ${currencyFormatter.format(r.socialSecurityTax)}`);
    if (r.selfEmploymentTax > 0) {
      const se = r.selfEmploymentTax;
      const seBase = se - (r.medicareTax * 2); 
      parts.push(`SE ${currencyFormatter.format(se)}`);
    }
    parts.push(`Medicare ${currencyFormatter.format(r.medicareTax)}`);
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
  switch (metricId) {
    case "take-home-pay":
      const takeHomeDiff = result.takeHomePay - baseline.takeHomePay;
      return { diff: takeHomeDiff, isPositive: takeHomeDiff > 0 };
    case "federal-income-tax":
      const fedDiff = result.federalIncomeTax - baseline.federalIncomeTax;
      return { diff: fedDiff, isPositive: fedDiff < 0 };
    case "payroll-tax":
      const payrollDiff = result.payrollTax - baseline.payrollTax;
      return { diff: payrollDiff, isPositive: payrollDiff < 0 };
    default:
      return { diff: 0, isPositive: false };
  }
}