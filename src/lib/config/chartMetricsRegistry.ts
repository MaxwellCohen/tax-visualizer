/**
 * Unified chart registry: each row defines a tax metric (`compute`), optional Sankey structural nodes, Mekko/summary
 * hints, and serialization order. Registry data lives in {@link TAX_CALC_REGISTRY} (`~/lib/config/TAX_CALC_REGISTRY`).
 *
 * **Evaluation contract:** Tax math for chart metrics runs only through {@link computeTaxMetricLines}. Each registry
 * `compute` mutates {@link ChartMetricComputeContext.accreted} on demand (calling private `accrete*` helpers that wrap
 * the former pipeline steps). There is no {@link TaxPipelineSnapshot} object or separate pipeline builder—only this
 * loop and shared helpers. The only preparation outside this module is resolving which {@link TaxYearConfig} applies.
 *
 * **Detailed display list:** Rows with {@link ChartRegistryEntry.detailedDisplay} drive {@link buildDisplayItemsConfig}
 * (single add/remove point with the registry).
 *
 * **Sankey:** Optional {@link ChartRegistryEntry.sankey} `phase` + `append` contribute nodes/links when
 * {@link sankeyRegistryRunner.runSankeyRegistryAppendersForPhase} runs for that phase. Not every metric maps 1:1 to graph elements (e.g. gross
 * uses one node per income form row); unmigrated phases still use `taxCharts.sankeyPhase*` helpers.
 *
 * **Income column order:** {@link INCOME_KIND_SANKEY_ORDER} / {@link INCOME_KIND_CHART_ORDER_BY_KIND} come from
 * `sankey.incomeKindVerticalOrder` on the gross-income rows whose `visualizationSourceId` is an {@link IncomeKind}.
 *
 * **Sankey node layout:** each structural bar’s style/column/order is defined on the owning row via
 * `sankey.structuralNode` / `sankey.structuralNodes`. {@link SANKEY_NODE_LAYOUT} is derived; removing the last row
 * that defines a `kind` removes that node from the derived layout.
 */
import type { DeductionKind, IncomeKind, TaxSegment } from "~/lib/taxCalc.types";
import type {
  DisplayItemConfig,
  DisplayItemFormat,
  TaxFormRow,
  TaxMetricComputedValue,
  TaxMetricLine,
} from "~/lib/taxForm.types";
import type { TaxCalculationInputs, TaxCalculationState } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { buildChartMetricComputeContext, type ChartMetricComputeContext, type ChartMetricMekkoHint, type ChartMetricSankeyHint, type ChartMetricSummaryHint, type ChartMetricValueKind, type SankeyNodeLayoutEntry } from "./chartMetricRegistryCompute";
import { TAX_CALC_REGISTRY } from "./TAX_CALC_REGISTRY";

export type {
  ChartMetricComputeContext,
  ChartMetricMekkoHint,
  ChartMetricSankeyHint,
  ChartMetricSummaryCategory,
  ChartMetricSummaryHint,
  ChartMetricValueKind,
  ChartPipelineAccretion,
  SankeyNodeLayoutEntry,
} from "./chartMetricRegistryCompute";

/** Row in the detailed income/tax breakdown panel; lives on registry entries as {@link ChartRegistryEntry.detailedDisplay}. */
export type ChartMetricDetailedDisplayHint = {
  order: number;
  type: string;
  category: "income" | "pretax" | "deduction" | "tax" | "credit" | "summary";
  format?: "currency" | "percent" | "number";
  label?: string;
  tooltip?: string;
  color?: string;
  highlight?: boolean;
};

export type ChartRegistryEntry = {
  metricsKey: string;
  valueKind: ChartMetricValueKind;
  /** Optional display id → chart key (see VISUALIZATION_METRIC_ID_TO_CHART_KEY). */
  visualizationSourceId?: string;
  /** If set, this metric appears in the default Tax Summary (see `buildDefaultMetricsConfig` in taxVisualization.config). */
  summary?: ChartMetricSummaryHint;
  /** If set, this metric appears in the detailed breakdown list (see `buildDisplayItemsConfig` in chartDisplayItems). */
  detailedDisplay?: ChartMetricDetailedDisplayHint;
  sankey?: ChartMetricSankeyHint;
  mekko?: ChartMetricMekkoHint;
  compute: (ctx: ChartMetricComputeContext) => number | TaxSegment[] | DeductionKind;
};

/** @deprecated Use {@link ChartRegistryEntry} */
export type ChartMetricRegistryEntry = ChartRegistryEntry;

export { TAX_CALC_REGISTRY };

/** Sankey income-column order: registry rows with `sankey.incomeKindVerticalOrder` and income `visualizationSourceId`. */
function buildIncomeKindSankeyOrderFromRegistry(): readonly { kind: IncomeKind; order: number }[] {
  const rows: { kind: IncomeKind; order: number }[] = [];
  for (const e of TAX_CALC_REGISTRY) {
    const o = e.sankey?.incomeKindVerticalOrder;
    if (e.visualizationSourceId != null && typeof o === "number") {
      rows.push({ kind: e.visualizationSourceId as IncomeKind, order: o });
    }
  }
  rows.sort((a, b) => a.order - b.order);
  return rows;
}

export const INCOME_KIND_SANKEY_ORDER = buildIncomeKindSankeyOrderFromRegistry();

export const INCOME_KIND_CHART_ORDER_BY_KIND = Object.fromEntries(
  INCOME_KIND_SANKEY_ORDER.map((k) => [k.kind, k.order]),
) as Record<IncomeKind, number>;

/** Element shape of {@link INCOME_KIND_SANKEY_ORDER}. */
export type SankeyOrderKind = {
  kind: IncomeKind | string;
  order: number;
};

function collectStructuralNodesFromRegistry(registry: readonly ChartRegistryEntry[]): SankeyNodeLayoutEntry[] {
  const byKind = new Map<string, SankeyNodeLayoutEntry>();
  for (const e of registry) {
    const s = e.sankey;
    if (!s) continue;
    const nodes: SankeyNodeLayoutEntry[] = [];
    if (s.structuralNode) nodes.push(s.structuralNode);
    if (s.structuralNodes) nodes.push(...s.structuralNodes);
    for (const n of nodes) {
      if (!byKind.has(n.kind)) {
        byKind.set(n.kind, n);
      }
    }
  }
  return [...byKind.values()].sort((a, b) => a.order - b.order);
}

/** Derived from `sankey.structuralNode(s)` on {@link TAX_CALC_REGISTRY} rows. */
const SANKEY_NODE_LAYOUT: readonly SankeyNodeLayoutEntry[] = collectStructuralNodesFromRegistry(TAX_CALC_REGISTRY);

/** Fallback when a node kind is not listed (e.g. future kinds). */
export const SANKEY_NODE_FILL_DEFAULT = "var(--sankey-node-7)";
export const SANKEY_LINK_STROKE_DEFAULT = "var(--sankey-link)";

/** Highest semantic column index in {@link SANKEY_NODE_LAYOUT} (inclusive). */
export const SANKEY_VISUAL_SEMANTIC_MAX = Math.max(0, ...SANKEY_NODE_LAYOUT.map((e) => e.column));

export const SANKEY_NODE_KIND_CHART_ORDER: Record<string, number> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map((k) => [k.kind, k.order]),
);

export const SANKEY_VISUAL_COLUMN_BY_KIND: Record<string, number> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map((k) => [k.kind, k.column]),
);

export const SANKEY_NODE_STYLE_BY_KIND: Record<string, SankeyNodeLayoutEntry> = Object.fromEntries(
  SANKEY_NODE_LAYOUT.map((e) => [e.kind, e]),
);

/** Keys in resolve / `TAX_CHART_METRICS_KEYS` order. */
export const TAX_CHART_METRICS_KEYS_FROM_REGISTRY = TAX_CALC_REGISTRY.map((e) => e.metricsKey);

export const SEGMENT_METRIC_KEYS_FROM_REGISTRY = new Set(
  TAX_CALC_REGISTRY.filter((e) => e.valueKind === "segments").map((e) => e.metricsKey),
);

/** Pipeline serialization order (matches registry array order). */
export const PIPELINE_COMPUTED_ROW_ORDER_FULL_FROM_REGISTRY = TAX_CALC_REGISTRY.map((e) => e.metricsKey);

/** Internal fold for legacy callers; UI should read {@link TaxResult.metricLines} / rows instead. */
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
 * Single driver: builds {@link TaxMetricLine}[] by iterating {@link TAX_CALC_REGISTRY} in order. Each `compute`
 * fills {@link ChartMetricComputeContext.accreted} via `accrete*` helpers and returns the metric value. Produces
 * {@link taxMetricsRecordFromLines} when a folded record is needed.
 */
export function computeTaxMetricLines(
  formRows: TaxFormRow[],
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
): TaxMetricLine[] {
  const ctx = buildChartMetricComputeContext(formRows, inputs, config);
  return TAX_CALC_REGISTRY.map((entry) => ({
    id: entry.visualizationSourceId ?? String(entry.metricsKey),
    metricsKey: entry.metricsKey,
    valueKind: entry.valueKind,
    value: entry.compute(ctx) as TaxMetricComputedValue,
  }));
}

export function computeTaxChartMetricsFromRegistry(
  formRows: TaxFormRow[],
  _state: TaxCalculationState,
  config: TaxYearConfig,
): Partial<Record<string, TaxMetricComputedValue>> {
  const lines = computeTaxMetricLines(formRows, _state.inputs, config);
  return taxMetricsRecordFromLines(lines);
}

/** Build VISUALIZATION_METRIC_ID_TO_CHART_KEY from registry `visualizationSourceId` fields. */
export function buildVisualizationMetricIdToChartKey(): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const e of TAX_CALC_REGISTRY) {
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

/** Detailed breakdown rows from registry `detailedDisplay` metadata. */
function buildDisplayItemsConfig(): DisplayItemConfig[] {
  return TAX_CALC_REGISTRY.filter((e) => e.detailedDisplay != null)
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

/** Registry order for the detailed breakdown panel (see {@link buildDisplayItems} in `~/lib/taxDisplayItems`). */
export const DISPLAY_ITEMS_CONFIG: DisplayItemConfig[] = buildDisplayItemsConfig();
