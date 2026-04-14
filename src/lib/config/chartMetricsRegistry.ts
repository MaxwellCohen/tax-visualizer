/**
 * Unified chart registry: each row defines a tax metric (`calculate`), optional Sankey node/link metadata,
 * summary hints, and serialization order. Registry data lives in {@link getConfigItems} from Page.config.ts.
 *
 * **Evaluation contract:** Tax math for chart metrics runs only through {@link computeTaxMetricLines}. Each 
 * config item's `calculate` function computes the metric value directly from form rows, tax config, and filing status.
 *
 * **Detailed display list:** Rows with `detailedDisplay` in configItem drive buildDisplayItemsConfig.
 *
 * **Sankey:** Config items with `sankeySettings` provide node/link metadata. Filter to positive values for display.
 */
import type { IncomeKind, TaxSegment } from "~/lib/taxCalc.types";
import type {
  DisplayItemConfig,
  DisplayItemFormat,
  TaxFormRow,
  TaxMetricComputedValue,
  TaxMetricLine,
} from "~/lib/taxForm.types";
import type { TaxCalculationInputs, TaxCalculationState } from "~/lib/taxConfig.types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import { getConfigItems, type configItem, SANKEY_IDS } from "./page/Page.config";

export type ChartMetricValueKind = "number";

export type ChartMetricSummaryCategory = "income" | "pretax" | "deduction" | "tax" | "credit" | "summary";

export type ChartMetricSummaryHint = {
  summaryId: string;
  label: string;
  category: ChartMetricSummaryCategory;
  displayOrder: number;
  format?: "currency" | "percent" | "number";
  highlight?: boolean;
  hideWhenZero?: boolean;
};

export type ChartMetricDetailedDisplayHint = {
  order: number;
  type: string;
  category: ChartMetricSummaryCategory;
  format?: "currency" | "percent" | "number";
  label?: string;
  tooltip?: string;
  color?: string;
  highlight?: boolean;
};

export type ChartRegistryEntry = {
  metricsKey: string;
  valueKind: ChartMetricValueKind;
  visualizationSourceId?: string;
  summary?: ChartMetricSummaryHint;
  detailedDisplay?: ChartMetricDetailedDisplayHint;
  calculate: (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => number;
};

/** @deprecated Use configItem directly from Page.config.ts */
export type ChartMetricRegistryEntry = ChartRegistryEntry;

export { SANKEY_IDS };

/** Convert configItem to ChartRegistryEntry format for compatibility */
function configItemToRegistryEntry(item: configItem, _index: number): ChartRegistryEntry {
  return {
    metricsKey: item.id,
    valueKind: "number",
    visualizationSourceId: item.id,
    summary: item.summary,
    detailedDisplay: item.detailedDisplay,
    calculate: item.calculate ?? (() => 0),
  };
}

/** Get registry entries for a given tax year and filing status */
export function getTaxCalcRegistry(taxData: TaxYearConfig, filingStatus: FilingStatus): readonly ChartRegistryEntry[] {
  const items = getConfigItems(taxData, filingStatus);
  return items.map(configItemToRegistryEntry);
}

const registryCache = new Map<string, readonly ChartRegistryEntry[]>();

function getCachedRegistry(taxData: TaxYearConfig, filingStatus: FilingStatus): readonly ChartRegistryEntry[] {
  const key = filingStatus;
  let registry = registryCache.get(key);
  if (!registry) {
    registry = getTaxCalcRegistry(taxData, filingStatus);
    registryCache.set(key, registry);
  }
  return registry;
}

/** Keys in resolve order from config items. */
export function getTaxChartMetricsKeys(taxData: TaxYearConfig, filingStatus: FilingStatus): string[] {
  const registry = getCachedRegistry(taxData, filingStatus);
  return registry.map((e) => e.metricsKey);
}

/** Pipeline serialization order (matches config item order). */
export function getPipelineComputedRowOrderFull(taxData: TaxYearConfig, filingStatus: FilingStatus): string[] {
  return getTaxChartMetricsKeys(taxData, filingStatus);
}

/** Internal fold for legacy callers; UI should read TaxResult.metricLines / rows instead. */
export function taxMetricsRecordFromLines(
  lines: readonly TaxMetricLine[],
): Partial<Record<string, TaxMetricComputedValue>> {
  const m: Partial<Record<string, TaxMetricComputedValue>> = {};
  for (const line of lines) {
    m[line.metricsKey] = line.value;
  }
  return m;
}

/**
 * Single driver: builds TaxMetricLine[] by iterating config items in order. Each `calculate`
 * computes the metric value directly. Produces taxMetricsRecordFromLines when a folded record is needed.
 */
export function computeTaxMetricLines(
  formRows: TaxFormRow[],
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
): TaxMetricLine[] {
  const registry = getCachedRegistry(config, inputs.filingStatus);
  return registry.map((entry) => ({
    id: entry.visualizationSourceId ?? String(entry.metricsKey),
    metricsKey: entry.metricsKey,
    valueKind: entry.valueKind,
    value: entry.calculate(formRows, config, inputs.filingStatus) as TaxMetricComputedValue,
  }));
}

export function computeTaxChartMetricsFromConfig(
  formRows: TaxFormRow[],
  state: TaxCalculationState,
  config: TaxYearConfig,
): Partial<Record<string, TaxMetricComputedValue>> {
  const lines = computeTaxMetricLines(formRows, state.inputs, config);
  return taxMetricsRecordFromLines(lines);
}

/** Build VISUALIZATION_METRIC_ID_TO_CHART_KEY from config items. */
export function buildVisualizationMetricIdToChartKey(taxData: TaxYearConfig, filingStatus: FilingStatus): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  const registry = getCachedRegistry(taxData, filingStatus);
  for (const e of registry) {
    if (e.visualizationSourceId) {
      out[e.visualizationSourceId] = e.metricsKey;
    }
  }
  return out;
}

function getCategoryColor(category: DisplayItemConfig["category"]): string {
  const colors: Record<DisplayItemConfig["category"], string> = {
    income: "#22c55e",
    pretax: "#a855f7",
    deduction: "#f59e0b",
    tax: "#ef4444",
    credit: "#14b8a6",
    summary: "#0d9488",
  };
  return colors[category];
}

/** Detailed breakdown rows from configItem detailedDisplay metadata. */
export function getDisplayItemsConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): DisplayItemConfig[] {
  const registry = getCachedRegistry(taxData, filingStatus);
  return registry.filter((e) => e.detailedDisplay != null)
    .map((e) => {
      const d = e.detailedDisplay!;
      const label = d.label ?? e.summary?.label ?? String(e.metricsKey);
      const format = (d.format ?? e.summary?.format ?? "currency") as DisplayItemFormat;
      return {
        type: d.type,
        label,
        category: d.category,
        format,
        order: d.order,
        metricsKey: e.metricsKey,
        color: d.color ?? getCategoryColor(d.category),
        tooltip: d.tooltip,
        highlight: d.highlight ?? e.summary?.highlight,
      };
    })
    .sort((a, b) => a.order - b.order);
}

/** @deprecated Use computeTaxChartMetricsFromConfig */
export const computeTaxChartMetricsFromRegistry = computeTaxChartMetricsFromConfig;

/** @deprecated Use getDisplayItemsConfig */
export function buildDisplayItemsConfig(): DisplayItemConfig[] {
  return [];
}

/** @deprecated - segments no longer used */
export const SEGMENT_METRIC_KEYS_FROM_REGISTRY = new Set<string>();

/** @deprecated Use getTaxChartMetricsKeys */
export const TAX_CHART_METRICS_KEYS_FROM_REGISTRY: string[] = [];

/** @deprecated Use getPipelineComputedRowOrderFull */
export const PIPELINE_COMPUTED_ROW_ORDER_FULL_FROM_REGISTRY: string[] = [];

/** @deprecated Use getIncomeKindSankeyOrder */
export const INCOME_KIND_SANKEY_ORDER: readonly { kind: IncomeKind; order: number }[] = [];

/** @deprecated Use getDisplayItemsConfig */
export const DISPLAY_ITEMS_CONFIG: DisplayItemConfig[] = [];

/** @deprecated - not used */
export function getIncomeKindSankeyOrder(_taxData: TaxYearConfig, _filingStatus: FilingStatus) {
  return [];
}

/** @deprecated - not used */
export const INCOME_KIND_CHART_ORDER_BY_KIND = (_taxData: TaxYearConfig, _filingStatus: FilingStatus): Record<IncomeKind, number> => {
  return {} as Record<IncomeKind, number>;
};

/** @deprecated - not used */
export const SANKEY_LINK_STROKE_DEFAULT = "var(--sankey-link)";

/** @deprecated - not used */
export const SANKEY_NODE_FILL_DEFAULT = "var(--sankey-node-7)";

/** @deprecated - not used */
export const SANKEY_NODE_STYLE_BY_KIND: Record<string, unknown> = {};

/** Maps each node kind to a semantic column (0-3 for 4-column layout) */
export const SANKEY_VISUAL_COLUMN_BY_KIND: Record<string, number> = {
  incomeSource: 0,
  pretaxContribution: 0,
  deferredSink: 0,
  standardDeduction: 1,
  deduction: 1,
  deductionShield: 1,
  deductionBenefitSink: 1,
  ordinaryTaxableIncome: 1,
  payrollOrdinaryStrip: 1,
  longTermTaxableIncome: 1,
  ltcgDeductionShield: 1,
  ordinaryBracket: 2,
  ltcgBracket: 2,
  taxesFederal: 3,
  taxesPayroll: 3,
  federalCredits: 3,
  keep: 3,
};

/** Maximum semantic column value (3 = column index for 4 columns) */
export const SANKEY_VISUAL_SEMANTIC_MAX = 3;

/** @deprecated - not used */
export const SANKEY_NODE_KIND_CHART_ORDER: Record<string, number> = {};

/** @deprecated - not used */
export type SankeyNodeLayoutEntry = { kind: string; order?: number };

/** @deprecated - not used */
export function getSankeyNodeLayout(_taxData: TaxYearConfig, _filingStatus: FilingStatus): readonly { kind: string; order: number }[] {
  return [];
}

/** @deprecated - not used */
export function getSankeyVisualSemanticMax(_taxData: TaxYearConfig, _filingStatus: FilingStatus): number {
  return 4;
}

/** @deprecated - not used */
export function getSankeyNodeKindChartOrder(_taxData: TaxYearConfig, _filingStatus: FilingStatus): Record<string, number> {
  return {};
}

/** @deprecated - not used */
export function getSankeyVisualColumnByKind(_taxData: TaxYearConfig, _filingStatus: FilingStatus): Record<string, number> {
  return {};
}

/** @deprecated - not used */
export function getSankeyNodeStyleByKind(_taxData: TaxYearConfig, _filingStatus: FilingStatus): Record<string, { kind: string; fill?: string }> {
  return {};
}
