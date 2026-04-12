/**
 * Federal tax pipeline: runs config-driven item calcs from `taxItems`. Year-scoped brackets, caps,
 * payroll, and NIIT come from `getTaxYearConfig` (backed by `~/lib/config/yearValues` via
 * `~/lib/taxData.fromYearValues`). `TaxCalculationInputs.taxYear` is set from the form setting row
 * (`type: "setting"`, `id: "taxYear"`) in `rowsToTaxCalculationInputs` (`~/lib/taxCalc.inputs`).
 */
import type { TaxCalculationInputs, TaxCalculationState, TaxItemResult } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { createInitialState } from "~/lib/taxConfig.types";
import { getEnabledTaxItemCalcs, type TaxItemCalc, buildDisplayItems } from "~/lib/config/taxItems";
import { generateVisualizationConfig, type VisualizationConfig } from "~/lib/config/visualization";
import {
  PIPELINE_COMPUTED_ROW_ORDER,
  PIPELINE_FLAT_SPECS,
  SEGMENT_METADATA_ROW_IDS,
  type PipelineFlatValueSpec,
  deductionKindFromInputs,
} from "~/lib/config/pipelineTaxResult.config";
import type { TaxSegment } from "~/lib/taxCalc.types";
import type { TaxChartMetrics, TaxComputedRow, TaxFormRow, TaxResult } from "~/lib/taxForm.types";

export { createInitialState } from "~/lib/taxConfig.types";
export type { TaxCalculationInputs, TaxCalculationState, TaxItemResult } from "~/lib/taxConfig.types";
export type { TaxYearConfig } from "~/lib/taxData.types";
export { getTaxItemCalc, getEnabledTaxItemCalcs } from "~/lib/config/taxItems";
export { generateVisualizationConfig } from "~/lib/config/visualization";
export type { VisualizationConfig } from "~/lib/config/visualization";

export function createDefaultVisualizationConfig(): VisualizationConfig {
  return generateVisualizationConfig();
}

function sortByDependencies(items: TaxItemCalc[]): TaxItemCalc[] {
  const result: TaxItemCalc[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(item: TaxItemCalc): void {
    if (visited.has(item.id)) return;
    if (visiting.has(item.id)) {
      console.warn(`Circular dependency detected for ${item.id}`);
      return;
    }

    visiting.add(item.id);

    for (const depId of item.dependencies) {
      const depItem = items.find(i => i.id === depId);
      if (depItem && !visited.has(depId)) {
        visit(depItem);
      }
    }

    visiting.delete(item.id);
    visited.add(item.id);
    result.push(item);
  }

  for (const item of items) {
    if (!visited.has(item.id)) {
      visit(item);
    }
  }

  return result;
}

export function runCalculationPipeline(
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
): TaxCalculationState {
  const state = createInitialState(inputs);
  const enabledItems = getEnabledTaxItemCalcs();
  const sortedItems = sortByDependencies(enabledItems);

  for (const item of sortedItems) {
    if (!item.enabled) {
      continue;
    }

    const missingDeps = item.dependencies.filter((depId) => !state.results.has(depId));
    if (missingDeps.length > 0) {
      state.errors.push(`Tax item "${item.id}" missing dependencies: ${missingDeps.join(", ")}`);
      continue;
    }

    try {
      const result = item.calcFn(inputs, state, config);
      state.results.set(item.id, result);
    } catch (error) {
      state.errors.push(`Error calculating "${item.id}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (state.errors.length > 0) {
    console.error("Tax calculation errors:", state.errors);
  }

  return state;
}

type FlatBuildCtx = {
  getAmount: (displayType: string) => number;
  state: TaxCalculationState;
  flat: Partial<Record<keyof TaxChartMetrics, unknown>>;
};

function evaluatePipelineFlatSpec(spec: PipelineFlatValueSpec, ctx: FlatBuildCtx): unknown {
  switch (spec.kind) {
    case "display":
      return ctx.getAmount(spec.displayType);
    case "literalNumber":
      return spec.value;
    case "sumDisplay":
      return spec.displayTypes.reduce((s, t) => s + ctx.getAmount(t), 0);
    case "deductionKindFromInputs":
      return deductionKindFromInputs(ctx.state.inputs.useItemizedDeductions);
    case "stateMetadataNumber": {
      const r = ctx.state.results.get(spec.resultId);
      const v = r?.metadata?.[spec.field];
      return typeof v === "number" && Number.isFinite(v) ? v : 0;
    }
    case "segmentsFromState": {
      const r = ctx.state.results.get(spec.resultId);
      const segs = r?.metadata?.segments;
      return Array.isArray(segs) ? segs : [];
    }
    case "sumFlatNumeric":
      return spec.keys.reduce((s, k) => s + num(ctx.flat[k]), 0);
    case "maxMinusFlat": {
      const a = num(ctx.flat[spec.minuend]);
      const b = num(ctx.flat[spec.subtrahend]);
      return Math.max(0, a - b);
    }
  }
}

export function buildTaxResultFromState(state: TaxCalculationState): Record<string, unknown> {
  const displayItems = buildDisplayItems(state.inputs, state);
  const findItem = (type: string) => displayItems.find((item) => item.type === type);
  const getAmount = (type: string): number => findItem(type)?.amount ?? 0;

  const flat: Partial<Record<keyof TaxChartMetrics, unknown>> = {};
  const ctx: FlatBuildCtx = { getAmount, state, flat };

  for (const { key, spec } of PIPELINE_FLAT_SPECS) {
    flat[key] = evaluatePipelineFlatSpec(spec, ctx);
  }

  return {
    ...flat,
    warnings: state.warnings,
    errors: state.errors,
    metadata: state.metadata,
  } as Record<string, unknown>;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function computed(id: string, value: number, metadata?: Record<string, unknown>): TaxComputedRow {
  return metadata ? { type: "computed", id, value, metadata } : { type: "computed", id, value };
}

/** Build flat pipeline record into appended computed rows (canonical ids match {@link resolveTaxChartMetrics}) */
export function flatTaxRecordToComputedRows(flat: Record<string, unknown>): TaxComputedRow[] {
  const rows: TaxComputedRow[] = [];
  for (const id of PIPELINE_COMPUTED_ROW_ORDER) {
    if (SEGMENT_METADATA_ROW_IDS.has(id)) {
      const segments = (flat[id] as TaxSegment[]) ?? [];
      rows.push(computed(id, 0, { segments }));
    } else if (id === "deductionKind") {
      rows.push(computed(id, 0, { kind: flat.deductionKind }));
    } else {
      rows.push(computed(id, num(flat[id])));
    }
  }
  return rows;
}

function cloneFormRows(rows: TaxFormRow[]): TaxFormRow[] {
  return rows.map((r) => ({ ...r }));
}

export function buildTaxResultFromPipeline(
  formRows: TaxFormRow[],
  state: TaxCalculationState,
  warnings: string[],
): TaxResult {
  const flat = buildTaxResultFromState(state) as Record<string, unknown>;
  const computedRows = flatTaxRecordToComputedRows(flat);
  return {
    rows: [...cloneFormRows(formRows), ...computedRows],
    warnings,
    notes: [],
    errors: [...state.errors],
    metadata: { ...(typeof flat.metadata === "object" && flat.metadata !== null ? flat.metadata : {}) },
  };
}

export function getResults(state: TaxCalculationState): Map<string, TaxItemResult> {
  return state.results;
}
