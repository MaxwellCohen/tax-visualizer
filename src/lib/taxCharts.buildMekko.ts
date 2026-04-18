import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";

export type MekkoRowKind =
  | "deduction"
  | "pretax"
  | "seAdjustment"
  | "payrollTax"
  | "ordinaryBracket"
  | "ltcgBracket";

export type MekkoRow = {
  id: string;
  label: string;
  total: number;
  keep: number;
  tax: number;
  kind: MekkoRowKind;
  marginalRate?: number;
};

const MEKKO_LEADING_SLICES = [
  "mekkoPretaxDeferrals",
  "mekkoSelfEmploymentTaxDeduction",
  "mekkoDeductionShieldNet",
  "mekkoPayrollTaxFromShield",
] as const;

function findConfigValue(cc: CalculatedConfigItem[], id: string): number {
  return cc.find(i => i.id === id)?.computedValue ?? 0;
}

/** Keep from sibling nodes; tax fills remainder so keep + tax === total. */
function keepTaxFromSlice(cc: CalculatedConfigItem[], total: number, keepId: string): { keep: number; tax: number } {
  if (total <= 0) return { keep: 0, tax: 0 };
  const keep = Math.max(0, Math.min(findConfigValue(cc, keepId), total));
  const tax = total - keep;
  return { keep, tax };
}

function rowFromCalculatedItem(item: CalculatedConfigItem, cc: CalculatedConfigItem[]): MekkoRow {
  const column = item.mekkoSettings!.column!;
  const total = item.computedValue;

  const bracketMatch = /^bracket-(\d+)-income$/.exec(item.id);
  let keep: number;
  let tax: number;
  if (bracketMatch) {
    const n = bracketMatch[1];
    ({ keep, tax } = keepTaxFromSlice(cc, total, `bracket-${n}-keep`));
  } else if (item.id === "ltcg-income") {
    ({ keep, tax } = keepTaxFromSlice(cc, total, "ltcg-keep"));
  } else {
    keep = total;
    tax = 0;
  }

  return {
    id: item.id,
    label: item.shortLabel ?? item.label,
    total,
    keep,
    tax,
    kind: column.kind as MekkoRowKind,
    marginalRate: column.row,
  };
}

export function buildMekkoFromConfig(cc: CalculatedConfigItem[]): MekkoRow[] {
  const byId = new Map(cc.map(i => [i.id, i]));
  const rows: MekkoRow[] = [];

  for (const id of MEKKO_LEADING_SLICES) {
    const item = byId.get(id);
    if (item && item.computedValue > 0 && item.mekkoSettings?.column) {
      rows.push(rowFromCalculatedItem(item, cc));
    }
  }

  const bracketItems = cc
    .filter(i => /^bracket-\d+-income$/.test(i.id) && i.computedValue > 0 && i.mekkoSettings?.column)
    .sort((a, b) => {
      const na = Number(/^bracket-(\d+)-income$/.exec(a.id)?.[1] ?? 0);
      const nb = Number(/^bracket-(\d+)-income$/.exec(b.id)?.[1] ?? 0);
      return na - nb;
    });
  for (const item of bracketItems) {
    rows.push(rowFromCalculatedItem(item, cc));
  }

  const ltcg = cc.find(i => i.id === "ltcg-income" && i.computedValue > 0 && i.mekkoSettings?.column);
  if (ltcg) {
    rows.push(rowFromCalculatedItem(ltcg, cc));
  }

  return rows;
}
