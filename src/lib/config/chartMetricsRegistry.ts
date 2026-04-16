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
import type {
  TaxFormRow,
  TaxMetricComputedValue,
  TaxMetricLine,
} from "~/lib/taxForm.types";
import type { TaxCalculationInputs } from "~/lib/taxConfig.types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import { getConfigItems, type configItem } from "./page/Page.config";

export type ChartMetricValueKind = "number";

export type ChartMetricSummaryCategory = "income" | "pretax" | "deduction" | "tax" | "credit" | "summary" | "takehome" | "rate";

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
function getTaxCalcRegistry(taxData: TaxYearConfig, filingStatus: FilingStatus): readonly ChartRegistryEntry[] {
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


/** @deprecated - segments no longer used */
export const SEGMENT_METRIC_KEYS_FROM_REGISTRY = new Set<string>();



