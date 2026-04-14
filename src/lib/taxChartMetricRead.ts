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
  const brackets = getOrdinaryBracketItems(result);
  return brackets.map(b => ({
    marginalRate: b.marginalRate,
    rangeStart: 0,
    rangeEnd: null,
    incomeAmount: b.income,
    taxAmount: b.tax,
  }));
}

export function getLongTermCapitalGainsSegments(result: TaxResult): TaxSegment[] {
  const brackets = getLtcgBracketItems(result);
  return brackets.map(b => ({
    marginalRate: b.marginalRate,
    rangeStart: 0,
    rangeEnd: null,
    incomeAmount: b.income,
    taxAmount: b.tax,
  }));
}

export type BracketItem = {
  id: string;
  income: number;
  tax: number;
  keep: number;
  marginalRate: number;
};

function findBracketItem(result: TaxResult, prefix: string, index: number, suffix: string): { value: number } | undefined {
  const key = `${prefix}-${index}${suffix}`;
  if (result.metricLines?.length) {
    const line = result.metricLines.find((l) => l.metricsKey === key);
    if (line && line.valueKind === "number") {
      const v = line.value;
      return { value: typeof v === "number" && Number.isFinite(v) ? v : 0 };
    }
  }
  for (const row of result.rows) {
    if (isComputedRow(row) && row.id === key) {
      return { value: typeof row.value === "number" && Number.isFinite(row.value) ? row.value : 0 };
    }
  }
  return undefined;
}

function extractBracketRate(id: string): number {
  const match = id.match(/(\d+)%/);
  if (match) {
    return parseInt(match[1], 10) / 100;
  }
  return 0;
}

export function getOrdinaryBracketItems(result: TaxResult): BracketItem[] {
  const items: BracketItem[] = [];
  let index = 0;
  while (true) {
    const incomeLine = findBracketItem(result, "bracket", index, "-income");
    const taxLine = findBracketItem(result, "bracket", index, "-tax");
    const keepLine = findBracketItem(result, "bracket", index, "-keep");
    if (!incomeLine) break;
    const income = incomeLine.value;
    const tax = taxLine?.value ?? 0;
    const rate = income > 0 && tax > 0 ? tax / income : 0;
    const keep = keepLine?.value ?? Math.max(0, income - tax);
    if (income > 0 || tax > 0 || keep > 0) {
      items.push({
        id: `bracket-${index}`,
        income,
        tax,
        keep,
        marginalRate: rate,
      });
    }
    index++;
  }
  return items;
}

export function getLtcgBracketItems(result: TaxResult): BracketItem[] {
  const items: BracketItem[] = [];
  let index = 0;
  while (true) {
    const incomeLine = findBracketItem(result, "ltcg-bracket", index, "-income");
    const taxLine = findBracketItem(result, "ltcg-bracket", index, "-tax");
    const keepLine = findBracketItem(result, "ltcg-bracket", index, "-keep");
    if (!incomeLine) break;
    const income = incomeLine.value;
    const tax = taxLine?.value ?? 0;
    const rate = income > 0 && tax > 0 ? tax / income : 0;
    const keep = keepLine?.value ?? Math.max(0, income - tax);
    if (income > 0 || tax > 0 || keep > 0) {
      items.push({
        id: `ltcg-bracket-${index}`,
        income,
        tax,
        keep,
        marginalRate: rate,
      });
    }
    index++;
  }
  return items;
}
