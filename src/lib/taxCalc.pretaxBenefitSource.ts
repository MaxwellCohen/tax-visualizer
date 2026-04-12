import type { PretaxBenefitSource, PretaxBenefitKind } from "~/lib/taxCalc.types";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";

export const PRETAX_BENEFIT_KIND_VALUES = [
  "preTax401kSpouse1",
  "preTax403bSpouse1",
  "preTax457bSpouse1",
  "preTax401kSpouse2",
  "preTax403bSpouse2",
  "preTax457bSpouse2",
  "preTaxHsaSpouse1",
  "preTaxHsaSpouse2",
  "preTaxOther",
  "preTaxHealthFsaSpouse1",
  "preTaxHealthFsaSpouse2",
  "preTaxDependentCareFsaSpouse1",
  "preTaxDependentCareFsaSpouse2",
  "preTaxCommuterSpouse1",
  "preTaxCommuterSpouse2",
  "traditionalIraSpouse1",
  "traditionalIraSpouse2",
] as const;

export const AGGREGATED_PRETAX_KEYS = [
  "preTax401kSpouse1",
  "preTax401kSpouse2",
  "preTaxHsaSpouse1",
  "preTaxHsaSpouse2",
  "preTaxOther",
  "traditionalIraSpouse1",
  "traditionalIraSpouse2",
] as const;

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

export type AggregatedPretax = Record<typeof AGGREGATED_PRETAX_KEYS[number], number>;

const SPOUSE2_KINDS = new Set<PretaxBenefitKind>([
  "preTax401kSpouse2",
  "preTax403bSpouse2",
  "preTax457bSpouse2",
  "preTaxHsaSpouse2",
  "preTaxHealthFsaSpouse2",
  "preTaxDependentCareFsaSpouse2",
  "preTaxCommuterSpouse2",
  "traditionalIraSpouse2",
]);

export function isPretaxSpouse2Kind(kind: PretaxBenefitKind): boolean {
  return SPOUSE2_KINDS.has(kind);
}

export function aggregatedKeyForKind(kind: PretaxBenefitKind): keyof AggregatedPretax {
  switch (kind) {
    case "preTax401kSpouse1":
    case "preTax403bSpouse1":
    case "preTax457bSpouse1":
      return "preTax401kSpouse1";
    case "preTax401kSpouse2":
    case "preTax403bSpouse2":
    case "preTax457bSpouse2":
      return "preTax401kSpouse2";
    case "preTaxHsaSpouse1":
      return "preTaxHsaSpouse1";
    case "preTaxHsaSpouse2":
      return "preTaxHsaSpouse2";
    case "preTaxOther":
    case "preTaxHealthFsaSpouse1":
    case "preTaxHealthFsaSpouse2":
    case "preTaxDependentCareFsaSpouse1":
    case "preTaxDependentCareFsaSpouse2":
    case "preTaxCommuterSpouse1":
    case "preTaxCommuterSpouse2":
      return "preTaxOther";
    case "traditionalIraSpouse1":
      return "traditionalIraSpouse1";
    case "traditionalIraSpouse2":
      return "traditionalIraSpouse2";
  }
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

export function aggregatePretaxFromSources(
  sources: PretaxBenefitSource[],
  joint: boolean,
): AggregatedPretax {
  const out = emptyAggregatedPretax();
  for (const s of sources) {
    if (!joint && isPretaxSpouse2Kind(s.kind)) continue;
    out[aggregatedKeyForKind(s.kind)] += s.amount;
  }
  return out;
}

export function clampAggregatedPretaxToLimits(
  agg: AggregatedPretax,
  lim: PretaxBenefitLimits,
  joint: boolean,
): AggregatedPretax {
  const c401 = lim.electiveDeferral401k;
  const p1 = Math.min(agg.preTax401kSpouse1, c401);
  const p2 = joint ? Math.min(agg.preTax401kSpouse2, c401) : 0;

  let h1 = agg.preTaxHsaSpouse1;
  let h2 = joint ? agg.preTaxHsaSpouse2 : 0;
  if (joint) {
    h1 = Math.min(h1, lim.hsaFamily);
    h2 = Math.min(h2, Math.max(0, lim.hsaFamily - h1));
  } else {
    h1 = Math.min(h1, lim.hsaSelfOnly);
    h2 = 0;
  }

  const iraCap = lim.traditionalIraContribution;
  const i1 = Math.min(agg.traditionalIraSpouse1, iraCap);
  const i2 = joint ? Math.min(agg.traditionalIraSpouse2, iraCap) : 0;

  return {
    preTax401kSpouse1: p1,
    preTax401kSpouse2: joint ? p2 : 0,
    preTaxHsaSpouse1: h1,
    preTaxHsaSpouse2: joint ? h2 : 0,
    preTaxOther: agg.preTaxOther,
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

function distributeSlotAmount(
  rows: PretaxBenefitSource[],
  slot: keyof AggregatedPretax,
  targetTotal: number,
): void {
  const matched = rows.filter(r => aggregatedKeyForKind(r.kind) === slot);
  if (matched.length === 0) return;
  const sum = matched.reduce((a, r) => a + r.amount, 0);
  const t = Math.max(0, targetTotal);
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

export function distributeAggregatedPretaxToSources(
  sources: PretaxBenefitSource[],
  target: AggregatedPretax,
): PretaxBenefitSource[] {
  const rows = sources.map(s => ({ ...s }));
  for (const slot of AGGREGATED_PRETAX_KEYS) {
    distributeSlotAmount(rows, slot, target[slot]);
  }
  return rows;
}

export function pretaxScalarsToMinimalSources(agg: AggregatedPretax): PretaxBenefitSource[] {
  const rows: PretaxBenefitSource[] = [];
  for (const slot of AGGREGATED_PRETAX_KEYS) {
    const amt = agg[slot];
    if (amt > 0) {
      rows.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `ptx-${Math.random()}`,
        kind: slot,
        label: "",
        amount: amt,
      });
    }
  }
  if (rows.length === 0) {
    rows.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `ptx-${Math.random()}`,
      kind: "preTax401kSpouse1",
      label: "",
      amount: 0,
    });
  }
  return rows;
}