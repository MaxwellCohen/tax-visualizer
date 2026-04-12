import type { DeductionKind, TaxSegment } from "~/lib/taxCalc.types";
import { taxMetricsRecordFromLines } from "~/lib/config/chartMetricsRegistry";
import { SEGMENT_METADATA_ROW_IDS, TAX_CHART_METRICS_KEYS } from "~/lib/config/pipelineTaxResult.config";
import type { TaxChartMetrics, TaxComputedRow, TaxResult, TaxResultRow } from "~/lib/taxForm.types";
import { isComputedRow, isComputedSegmentRow } from "~/lib/taxForm.types";

function deductionKindFromRows(rows: TaxResultRow[]): DeductionKind {
  for (const r of rows) {
    if (r.type === "setting" && r.id === "useItemizedDeductions") {
      return r.value ? "itemized" : "standard";
    }
  }
  return "standard";
}

/** Reconstructs {@link TaxChartMetrics} from {@link TaxResult.rows} when `metricLines` is absent. */
function chartMetricsFromComputedRowsOnly(result: TaxResult): TaxChartMetrics {
  const rows = result.rows;
  const numericById = new Map<string, TaxComputedRow>();
  const segmentsById = new Map<string, TaxSegment[]>();
  for (const row of rows) {
    if (isComputedRow(row)) {
      numericById.set(row.id, row);
    } else if (isComputedSegmentRow(row)) {
      segmentsById.set(row.id, row.segments);
    }
  }

  const deductionKind = deductionKindFromRows(rows);

  const out = {} as TaxChartMetrics;
  for (const key of TAX_CHART_METRICS_KEYS) {
    if (key === "deductionKind") {
      (out as Record<string, unknown>)[key] = deductionKind;
      continue;
    }
    if (SEGMENT_METADATA_ROW_IDS.has(key)) {
      (out as Record<string, unknown>)[key] = segmentsById.get(key) ?? [];
      continue;
    }
    const row = numericById.get(key);
    if (!row) {
      (out as Record<string, unknown>)[key] = 0;
      continue;
    }
    (out as Record<string, unknown>)[key] =
      typeof row.value === "number" && Number.isFinite(row.value) ? row.value : 0;
  }
  return out;
}

/**
 * Chart metrics for display. Prefer {@link TaxResult.metricLines}; otherwise reconstruct from computed rows
 * (including segment rows when present).
 */
export function resolveTaxChartMetrics(result: TaxResult): TaxChartMetrics {
  if (result.metricLines?.length) {
    return taxMetricsRecordFromLines(result.metricLines);
  }
  return chartMetricsFromComputedRowsOnly(result);
}
