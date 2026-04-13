import type { PretaxBenefitSource, PretaxBenefitKind } from "~/lib/taxCalc.types";
import { newPretaxRow } from "~/lib/taxForm.factories";
import { getTaxYearConfig } from "~/lib/taxData";

function finiteAmount(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Split a single §402(g) cap across N line items proportionally (used when clamping stored form rows). */
export function capAmountsTo402gPool(amounts: number[], limit: number): number[] {
  const amountsN = amounts.map((a) => finiteAmount(a));
  const sum = amountsN.reduce((a, b) => a + b, 0);
  if (sum <= limit || amountsN.length === 0) return amountsN;
  const out = amountsN.map((a) => Math.floor((limit * a) / sum));
  const drift = limit - out.reduce((a, b) => a + b, 0);
  if (drift > 0) {
    const maxIdx = amountsN.indexOf(Math.max(...amountsN));
    out[maxIdx] += drift;
  }
  return out;
}

/** IRS §402(g) elective deferral limit applies to combined 401(k)+403(b) per employee, not each line item. */
function applyElectiveDeferral402gLimit(raw401: number, raw403: number, limit: number): [number, number] {
  const sum = raw401 + raw403;
  if (sum <= 0) return [0, 0];
  const capped = Math.min(sum, limit);
  if (capped === sum) return [raw401, raw403];
  const a = Math.floor((capped * raw401) / sum);
  const b = Math.floor((capped * raw403) / sum);
  const drift = capped - a - b;
  if (drift > 0) {
    if (raw401 >= raw403) return [a + drift, b];
    return [a, b + drift];
  }
  return [a, b];
}

export const PRETAX_BENEFIT_KIND_VALUES: PretaxBenefitKind[] = [
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
];

export function isPretaxSpouse2Kind(kind: string): boolean {
  return kind.includes("spouse2");
}

export function aggregatePretaxFromSources(sources: PretaxBenefitSource[], joint: boolean, taxYear: number) {
  let raw401s1 = 0;
  let raw401s2 = 0;
  let raw403s1 = 0;
  let raw403s2 = 0;
  let raw457s1 = 0;
  let raw457s2 = 0;
  let rawHsa1 = 0;
  let rawHsa2 = 0;
  let rawOther = 0;
  let rawIra1 = 0;
  let rawIra2 = 0;

  for (const src of sources) {
    const kind = (src.kind as string).toLowerCase();
    const amount = finiteAmount(src.amount);

    if (kind.includes("401k")) {
      if (kind.includes("spouse2") && joint) raw401s2 += amount;
      else raw401s1 += amount;
    } else if (kind.includes("403b")) {
      if (kind.includes("spouse2") && joint) raw403s2 += amount;
      else raw403s1 += amount;
    } else if (kind.includes("457")) {
      if (kind.includes("spouse2") && joint) raw457s2 += amount;
      else raw457s1 += amount;
    } else if (kind.includes("hsa")) {
      if (kind.includes("spouse2") && joint) rawHsa2 += amount;
      else rawHsa1 += amount;
    } else if (kind.includes("traditionalira")) {
      if (kind.includes("spouse2") && joint) rawIra2 += amount;
      else rawIra1 += amount;
    } else {
      rawOther += amount;
    }
  }

  const config = getTaxYearConfig(taxYear);
  const electiveLimit = config?.pretaxLimits.electiveDeferral401k ?? 23_000;

  const [preTax401kSpouse1, preTax403bSpouse1] = applyElectiveDeferral402gLimit(raw401s1, raw403s1, electiveLimit);
  const [preTax401kSpouse2, preTax403bSpouse2] = joint
    ? applyElectiveDeferral402gLimit(raw401s2, raw403s2, electiveLimit)
    : [0, 0];

  return {
    preTax401kSpouse1,
    preTax403bSpouse1,
    preTax457bSpouse1: raw457s1,
    preTax401kSpouse2,
    preTax403bSpouse2,
    preTax457bSpouse2: raw457s2,
    preTaxHsaSpouse1: rawHsa1,
    preTaxHsaSpouse2: rawHsa2,
    preTaxOther: rawOther,
    traditionalIraSpouse1: rawIra1,
    traditionalIraSpouse2: rawIra2,
  };
}

export type AggregatedPretax = ReturnType<typeof aggregatePretaxFromSources>;

export function emptyAggregatedPretax(): AggregatedPretax {
  return {
    preTax401kSpouse1: 0,
    preTax403bSpouse1: 0,
    preTax457bSpouse1: 0,
    preTax401kSpouse2: 0,
    preTax403bSpouse2: 0,
    preTax457bSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
  };
}

export function newPretaxBenefitSource(overrides?: Partial<Omit<PretaxBenefitSource, "id">>): PretaxBenefitSource {
  const r = newPretaxRow(overrides);
  return { id: r.id, kind: r.kind, label: r.label, amount: r.amount };
}

export function pretaxScalarsToMinimalSources(agg: AggregatedPretax): PretaxBenefitSource[] {
  const sources: PretaxBenefitSource[] = [];
  
  if (agg.preTax401kSpouse1 > 0) {
    sources.push({ id: "1", kind: "preTax401kSpouse1", label: "401(k)", amount: agg.preTax401kSpouse1 });
  }
  if (agg.preTax401kSpouse2 > 0) {
    sources.push({ id: "1b", kind: "preTax401kSpouse2", label: "401(k) Spouse2", amount: agg.preTax401kSpouse2 });
  }
  if (agg.preTaxHsaSpouse1 > 0) {
    sources.push({ id: "2", kind: "preTaxHsaSpouse1", label: "HSA", amount: agg.preTaxHsaSpouse1 });
  }
  if (agg.preTaxHsaSpouse2 > 0) {
    sources.push({ id: "2b", kind: "preTaxHsaSpouse2", label: "HSA Spouse2", amount: agg.preTaxHsaSpouse2 });
  }
  if (agg.traditionalIraSpouse1 > 0) {
    sources.push({ id: "3", kind: "traditionalIraSpouse1", label: "Traditional IRA", amount: agg.traditionalIraSpouse1 });
  }
  if (agg.traditionalIraSpouse2 > 0) {
    sources.push({ id: "3b", kind: "traditionalIraSpouse2", label: "Traditional IRA Spouse2", amount: agg.traditionalIraSpouse2 });
  }
  if (agg.preTaxOther > 0) {
    sources.push({ id: "4", kind: "preTaxOther", label: "Other", amount: agg.preTaxOther });
  }
  
  return sources;
}