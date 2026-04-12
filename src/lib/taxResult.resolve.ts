import type { DeductionKind, TaxSegment } from "~/lib/taxCalc.types";
import {
  TAX_CHART_METRICS_KEYS,
  TAX_RESULT_ROW_IDS_KEEP_WHEN_VALUE_ZERO,
} from "~/lib/config/pipelineTaxResult.config";
import type { TaxChartMetrics, TaxComputedRow, TaxResult, TaxResultRow } from "~/lib/taxForm.types";
import { isComputedRow } from "~/lib/taxForm.types";

const KEEP_WHEN_VALUE_ZERO = new Set<string>(TAX_RESULT_ROW_IDS_KEEP_WHEN_VALUE_ZERO);

/**
 * Index computed rows for chart metrics. Omits rows with `value === 0` except ids in
 * {@link TAX_RESULT_ROW_IDS_KEEP_WHEN_VALUE_ZERO} (segment metadata and deduction kind).
 */
function computedByIdForCharts(rows: TaxResultRow[]): Map<string, TaxComputedRow> {
  const m = new Map<string, TaxComputedRow>();
  for (const row of rows) {
    if (!isComputedRow(row)) continue;
    if (row.value === 0 && !KEEP_WHEN_VALUE_ZERO.has(row.id)) continue;
    m.set(row.id, row);
  }
  return m;
}

function num(map: Map<string, TaxComputedRow>, id: string): number {
  return map.get(id)?.value ?? 0;
}

function segments(map: Map<string, TaxComputedRow>, id: string): TaxSegment[] {
  const meta = map.get(id)?.metadata;
  const segs = meta?.segments;
  return Array.isArray(segs) ? (segs as TaxSegment[]) : [];
}

function deductionKindFromRows(map: Map<string, TaxComputedRow>): DeductionKind {
  const meta = map.get("deductionKind")?.metadata;
  const k = meta?.kind;
  return k === "itemized" || k === "standard" ? k : "standard";
}

/** Builds {@link TaxChartMetrics} from {@link TaxResultRow} list (computed row ids match metric keys). */
export function buildTaxChartMetricsFromRows(rows: TaxResultRow[]): TaxChartMetrics {
  const m = computedByIdForCharts(rows);
  const out = {} as TaxChartMetrics;
  for (const key of TAX_CHART_METRICS_KEYS) {
    if (key === "ordinaryFederalSegments" || key === "longTermCapitalGainsSegments") {
      out[key] = segments(m, key);
    } else if (key === "deductionKind") {
      out[key] = deductionKindFromRows(m);
    } else {
      out[key] = num(m, key);
    }
  }
  return out;
}

/** Single place: row ids → chart/summary metrics */
export function resolveTaxChartMetrics(result: TaxResult): TaxChartMetrics {
  return buildTaxChartMetricsFromRows(result.rows);
}
