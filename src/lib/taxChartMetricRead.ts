import type { DeductionKind, TaxSegment } from "~/lib/taxCalc.types";
import { SEGMENT_METRIC_KEYS_FROM_REGISTRY } from "~/lib/config/chartMetricsRegistry";
import type {TaxResult, TaxResultRow } from "~/lib/taxForm.types";
import { isComputedRow, isComputedSegmentRow } from "~/lib/taxForm.types";

function deductionKindFromRows(rows: TaxResultRow[]): DeductionKind {
  for (const r of rows) {
    if (r.type === "setting" && r.id === "useItemizedDeductions") {
      return r.value ? "itemized" : "standard";
    }
  }
  return "standard";
}

/** Deduction mode from form settings on {@link TaxResult.rows}. */
export function deductionKindFromTaxResult(result: TaxResult): DeductionKind {
  return deductionKindFromRows(result.rows);
}

/**
 * Numeric chart metric from {@link TaxResult.metricLines} when present, otherwise from
 * {@link TaxResult.rows} computed lines. Segment keys return 0; use {@link chartMetricSegments} for those.
 */
export function chartMetricNumeric(result: TaxResult, key: string): number {
  if (SEGMENT_METRIC_KEYS_FROM_REGISTRY.has(key)) {
    return 0;
  }
  if (result.metricLines?.length) {
    const line = result.metricLines.find((l) => l.metricsKey === key);
    if (!line || line.valueKind !== "number") {
      return 0;
    }
    const v = line.value;
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  }
  for (const row of result.rows) {
    if (isComputedRow(row) && row.id === key) {
      return typeof row.value === "number" && Number.isFinite(row.value) ? row.value : 0;
    }
  }
  return 0;
}

/** Bracket segment arrays from metric lines or computed-segment rows. */
export function chartMetricSegments(result: TaxResult, key: string): TaxSegment[] {
  if (!SEGMENT_METRIC_KEYS_FROM_REGISTRY.has(key)) {
    return [];
  }
  if (result.metricLines?.length) {
    const line = result.metricLines.find((l) => l.metricsKey === key);
    if (line?.valueKind === "segments" && Array.isArray(line.value)) {
      return line.value as TaxSegment[];
    }
    return [];
  }
  for (const row of result.rows) {
    if (isComputedSegmentRow(row) && row.id === key) {
      return row.segments ?? [];
    }
  }
  return [];
}

export function getOrdinaryFederalSegments(result: TaxResult): TaxSegment[] {
  return chartMetricSegments(result, "ordinaryFederalSegments");
}

export function getLongTermCapitalGainsSegments(result: TaxResult): TaxSegment[] {
  return chartMetricSegments(result, "longTermCapitalGainsSegments");
}
