import { toMoneyValue } from "~/lib/taxCalc.money";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";

export type PretaxBenefitKind =
  | "preTax401kSpouse1"
  | "preTax401kSpouse2"
  | "preTaxHsaSpouse1"
  | "preTaxHsaSpouse2"
  | "preTaxOther"
  | "traditionalIraSpouse1"
  | "traditionalIraSpouse2";

export type PretaxBenefitSource = {
  id: string;
  kind: PretaxBenefitKind;
  /** Optional note (e.g. employer); not used in tax math. */
  label: string;
  amount: number;
};

/** Same numeric slots as the previous flat `TaxInput` pretax fields (aggregated from rows). */
export type AggregatedPretax = {
  preTax401kSpouse1: number;
  preTax401kSpouse2: number;
  preTaxHsaSpouse1: number;
  preTaxHsaSpouse2: number;
  preTaxOther: number;
  traditionalIraSpouse1: number;
  traditionalIraSpouse2: number;
};

/** Iteration order for serialization / migration. */
export const ALL_PRETAX_BENEFIT_KINDS: readonly PretaxBenefitKind[] = [
  "preTax401kSpouse1",
  "preTax401kSpouse2",
  "preTaxHsaSpouse1",
  "preTaxHsaSpouse2",
  "preTaxOther",
  "traditionalIraSpouse1",
  "traditionalIraSpouse2",
];

const SPOUSE2_KINDS = new Set<PretaxBenefitKind>([
  "preTax401kSpouse2",
  "preTaxHsaSpouse2",
  "traditionalIraSpouse2",
]);

export function isPretaxSpouse2Kind(kind: PretaxBenefitKind): boolean {
  return SPOUSE2_KINDS.has(kind);
}

export function emptyAggregatedPretax(): AggregatedPretax {
  return {
    preTax401kSpouse1: 0,
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
  };
}

let pretaxBenefitSeq = 0;

function newPretaxBenefitId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  pretaxBenefitSeq += 1;
  return `ptx-${pretaxBenefitSeq}`;
}

export function newPretaxBenefitSource(
  overrides?: Partial<Omit<PretaxBenefitSource, "id">>,
): PretaxBenefitSource {
  return {
    id: newPretaxBenefitId(),
    kind: "preTax401kSpouse1",
    label: "",
    amount: 0,
    ...overrides,
  };
}

/** Sum row amounts by kind. Rows with spouse-2 kinds are ignored when `joint` is false. */
export function aggregatePretaxFromSources(
  sources: PretaxBenefitSource[],
  joint: boolean,
): AggregatedPretax {
  const out = emptyAggregatedPretax();
  for (const s of sources) {
    if (!joint && isPretaxSpouse2Kind(s.kind)) continue;
    const add = toMoneyValue(s.amount);
    out[s.kind] += add;
  }
  return out;
}

function distributeKindAmount(rows: PretaxBenefitSource[], kind: PretaxBenefitKind, targetTotal: number): void {
  const matched = rows.filter(r => r.kind === kind);
  if (matched.length === 0) return;
  const sum = matched.reduce((a, r) => a + toMoneyValue(r.amount), 0);
  const t = Math.max(0, toMoneyValue(targetTotal));
  if (matched.length === 1) {
    matched[0].amount = t;
    return;
  }
  if (sum <= 0) {
    matched.forEach((r, i) => {
      r.amount = i === matched.length - 1 ? t : 0;
    });
    return;
  }
  const factor = t / sum;
  let allocated = 0;
  matched.forEach((r, i) => {
    if (i === matched.length - 1) {
      r.amount = Math.max(0, t - allocated);
    } else {
      const v = Math.round(r.amount * factor);
      r.amount = v;
      allocated += v;
    }
  });
}

/** Apply per-kind totals to rows (proportional split when multiple rows share a kind). */
export function distributeAggregatedPretaxToSources(
  sources: PretaxBenefitSource[],
  target: AggregatedPretax,
): PretaxBenefitSource[] {
  const rows = sources.map(s => ({ ...s }));
  for (const k of ALL_PRETAX_BENEFIT_KINDS) {
    distributeKindAmount(rows, k, target[k]);
  }
  return rows;
}

/** IRS caps applied to aggregated amounts (same rules as legacy flat fields). */
export function clampAggregatedPretaxToLimits(
  agg: AggregatedPretax,
  lim: PretaxBenefitLimits,
  joint: boolean,
): AggregatedPretax {
  const c401 = lim.electiveDeferral401k;
  const p1 = Math.min(toMoneyValue(agg.preTax401kSpouse1), c401);
  const p2 = joint ? Math.min(toMoneyValue(agg.preTax401kSpouse2), c401) : 0;

  let h1 = toMoneyValue(agg.preTaxHsaSpouse1);
  let h2 = joint ? toMoneyValue(agg.preTaxHsaSpouse2) : 0;
  if (joint) {
    h1 = Math.min(h1, lim.hsaFamily);
    h2 = Math.min(h2, Math.max(0, lim.hsaFamily - h1));
  } else {
    h1 = Math.min(h1, lim.hsaSelfOnly);
    h2 = 0;
  }

  const iraCap = lim.traditionalIraContribution;
  const i1 = Math.min(toMoneyValue(agg.traditionalIraSpouse1), iraCap);
  const i2 = joint ? Math.min(toMoneyValue(agg.traditionalIraSpouse2), iraCap) : 0;

  return {
    preTax401kSpouse1: p1,
    preTax401kSpouse2: joint ? p2 : 0,
    preTaxHsaSpouse1: h1,
    preTaxHsaSpouse2: joint ? h2 : 0,
    preTaxOther: toMoneyValue(agg.preTaxOther),
    traditionalIraSpouse1: i1,
    traditionalIraSpouse2: joint ? i2 : 0,
  };
}

export function filterPretaxSourcesForFiling(
  sources: PretaxBenefitSource[],
  joint: boolean,
): PretaxBenefitSource[] {
  if (joint) return sources;
  return sources.filter(s => !isPretaxSpouse2Kind(s.kind));
}

/** One row per non-zero scalar (migration from legacy flat fields); at least one row. */
export function pretaxScalarsToMinimalSources(agg: AggregatedPretax): PretaxBenefitSource[] {
  const rows: PretaxBenefitSource[] = [];
  for (const k of ALL_PRETAX_BENEFIT_KINDS) {
    const amt = toMoneyValue(agg[k]);
    if (amt > 0) {
      rows.push(newPretaxBenefitSource({ kind: k, amount: amt }));
    }
  }
  if (rows.length === 0) {
    rows.push(newPretaxBenefitSource({ kind: "preTax401kSpouse1" }));
  }
  return rows;
}
