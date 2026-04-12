import type { PretaxBenefitSource, PretaxBenefitKind } from "~/lib/taxCalc.types";
import { newPretaxRow } from "~/lib/taxForm.factories";
import { getTaxYearConfig } from "~/lib/taxData";

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

export function aggregatePretaxFromSources(sources: PretaxBenefitSource[], joint: boolean) {
  const result = {
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

  for (const src of sources) {
    const kind = src.kind as string;
    let amount = src.amount;
    const config = getTaxYearConfig(2025);
    const limit = config?.pretaxLimits.electiveDeferral401k ?? 23000;

    const kindL = kind.toLowerCase();
    if (kindL.includes("401k")) {
      amount = Math.min(amount, limit);
      if (kindL.includes("spouse1") || !kindL.includes("spouse")) result.preTax401kSpouse1 += amount;
      else if (joint) result.preTax401kSpouse2 += amount;
    } else if (kindL.includes("403b")) {
      if (kindL.includes("spouse2") && joint) result.preTax403bSpouse2 += amount;
      else result.preTax403bSpouse1 += amount;
    } else if (kindL.includes("457")) {
      if (kindL.includes("spouse2") && joint) result.preTax457bSpouse2 += amount;
      else result.preTax457bSpouse1 += amount;
    } else if (kindL.includes("hsa")) {
      if (kindL.includes("spouse2") && joint) result.preTaxHsaSpouse2 += amount;
      else result.preTaxHsaSpouse1 += amount;
    } else if (kindL.includes("traditionalira")) {
      if (kindL.includes("spouse2") && joint) result.traditionalIraSpouse2 += amount;
      else result.traditionalIraSpouse1 += amount;
    } else {
      result.preTaxOther += amount;
    }
  }

  return result;
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