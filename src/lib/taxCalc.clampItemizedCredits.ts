import type { FederalTaxCreditSource } from "~/lib/taxCalc.types";
import { FEDERAL_TAX_CREDIT_KIND_VALUES } from "~/lib/taxCalc.federalTaxCreditSource";
import type { ItemizedDeductionSource } from "~/lib/taxCalc.types";
import { toMoneyValue } from "~/lib/taxCalc.money";
import type { TaxInput } from "~/lib/taxCalc.types";
import { getTaxYearConfig } from "~/lib/taxData";
import type { FederalTaxCreditCaps, FilingStatus, ItemizedDeductionCaps } from "~/lib/taxData.types";

function distributeAmountAmongRowsMatchingKind<T extends { kind: string; amount: number }>(
  rows: T[],
  kind: string,
  targetTotal: number,
): T[] {
  const copy = rows.map(r => ({ ...r }));
  const matched = copy
    .map((_, i) => (copy[i].kind === kind ? i : -1))
    .filter((i): i is number => i >= 0);
  if (matched.length === 0) return copy;
  const sum = matched.reduce((a, i) => a + toMoneyValue(copy[i].amount), 0);
  const t = Math.max(0, toMoneyValue(targetTotal));
  if (sum <= t) return copy;
  const factor = t / sum;
  let allocated = 0;
  matched.forEach((idx, j) => {
    const last = j === matched.length - 1;
    if (last) {
      copy[idx].amount = Math.max(0, t - allocated);
    } else {
      const v = Math.round(toMoneyValue(copy[idx].amount) * factor);
      copy[idx].amount = v;
      allocated += v;
    }
  });
  return copy;
}

export function clampItemizedDeductionSourcesForCaps(
  rows: ItemizedDeductionSource[],
  filingStatus: FilingStatus,
  caps: ItemizedDeductionCaps | undefined,
): ItemizedDeductionSource[] {
  if (!caps) return rows;
  const max = caps.saltMax[filingStatus];
  return distributeAmountAmongRowsMatchingKind(rows, "salt", max);
}

export function clampFederalTaxCreditSourcesForCaps(
  rows: FederalTaxCreditSource[],
  caps: FederalTaxCreditCaps | undefined,
): FederalTaxCreditSource[] {
  if (!caps) return rows;
  let out = rows.map(r => ({ ...r }));
  for (const kind of FEDERAL_TAX_CREDIT_KIND_VALUES) {
    const cap = caps[kind];
    if (!Number.isFinite(cap) || cap < 0) continue;
    out = distributeAmountAmongRowsMatchingKind(out, kind, cap);
  }
  return out;
}

function sameSerialized<T>(a: T[], b: T[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Clamp SALT lines to `itemizedCaps.saltMax` and each federal credit kind to `federalTaxCreditCaps[kind]`. */
export function clampTaxInputItemizedAndCreditsToLimits(input: TaxInput): TaxInput {
  const config = getTaxYearConfig(input.taxYear);
  if (!config) return input;

  const itemized = clampItemizedDeductionSourcesForCaps(
    input.itemizedDeductions,
    input.filingStatus,
    config.itemizedCaps,
  );
  const credits = clampFederalTaxCreditSourcesForCaps(
    input.federalTaxCredits,
    config.federalTaxCreditCaps,
  );

  if (sameSerialized(itemized, input.itemizedDeductions) && sameSerialized(credits, input.federalTaxCredits)) {
    return input;
  }
  return {
    ...input,
    itemizedDeductions: itemized,
    federalTaxCredits: credits,
  };
}
