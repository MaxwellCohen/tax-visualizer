import type { TaxResult } from "~/lib/taxCalc";

export function sankeyIncomeNodeId(sourceId: string): string {
  return `income-${sourceId}`;
}

type WeightedKey = { key: string; weight: number };

/** Distribute `total` across keys proportional to weight; last receives remainder. */
export function allocateProportional(keys: WeightedKey[], total: number): { key: string; value: number }[] {
  const w = keys.reduce((s, x) => s + x.weight, 0);
  if (w <= 0 || total <= 0 || keys.length === 0) return [];
  let acc = 0;
  const out: { key: string; value: number }[] = [];
  keys.forEach((k, i) => {
    const last = i === keys.length - 1;
    const v = last ? Math.max(0, total - acc) : Math.round((k.weight / w) * total);
    acc += v;
    if (v > 0) out.push({ key: k.key, value: v });
  });
  return out;
}

export function ordinaryIncomeNodeEntries(result: TaxResult): WeightedKey[] {
  return result.incomeSources
    .filter(
      s =>
        s.amount > 0 &&
        (s.kind === "wages" || s.kind === "ordinary" || s.kind === "shortTermCapGains" || s.kind === "selfEmployment"),
    )
    .map(s => ({ key: sankeyIncomeNodeId(s.id), weight: s.amount }));
}

export function ltcgIncomeNodeEntries(result: TaxResult): WeightedKey[] {
  return result.incomeSources
    .filter(s => s.amount > 0 && s.kind === "longTermCapGains")
    .map(s => ({ key: sankeyIncomeNodeId(s.id), weight: s.amount }));
}

export function allIncomeNodeEntries(result: TaxResult): WeightedKey[] {
  return result.incomeSources.filter(s => s.amount > 0).map(s => ({
    key: sankeyIncomeNodeId(s.id),
    weight: s.amount,
  }));
}

export function wageIncomeNodeEntries(result: TaxResult): WeightedKey[] {
  return result.incomeSources
    .filter(s => s.amount > 0 && s.kind === "wages")
    .map(s => ({ key: sankeyIncomeNodeId(s.id), weight: s.amount }));
}

/** Prefer wages for FICA-style routing; fall back to all income if there are no wage rows. */
export function payrollSourceEntries(result: TaxResult): WeightedKey[] {
  const w = wageIncomeNodeEntries(result);
  if (w.length > 0) return w;
  return result.incomeSources
    .filter(s => s.amount > 0 && (s.kind === "wages" || s.kind === "selfEmployment" || s.kind === "ordinary"))
    .map(s => ({ key: sankeyIncomeNodeId(s.id), weight: s.amount }));
}
