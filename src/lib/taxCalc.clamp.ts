import { getTaxYearConfig } from "~/lib/taxData";
import type { TaxInput } from "~/lib/taxCalc.types";
import { toMoneyValue } from "~/lib/taxCalc.money";

/** Clamps 401(k), HSA, and traditional IRA fields to year limits in `TAX_DATA_BY_YEAR` (shared URLs, imports). */
export function clampTaxInputPretaxToLimits(input: TaxInput): TaxInput {
  const config = getTaxYearConfig(input.taxYear);
  if (!config) return input;

  const lim = config.pretaxLimits;
  const joint = input.filingStatus === "marriedJoint";
  const c401 = lim.electiveDeferral401k;
  const p1 = Math.min(toMoneyValue(input.preTax401kSpouse1), c401);
  const p2 = joint ? Math.min(toMoneyValue(input.preTax401kSpouse2), c401) : 0;

  let h1 = toMoneyValue(input.preTaxHsaSpouse1);
  let h2 = joint ? toMoneyValue(input.preTaxHsaSpouse2) : 0;
  if (joint) {
    h1 = Math.min(h1, lim.hsaFamily);
    h2 = Math.min(h2, Math.max(0, lim.hsaFamily - h1));
  } else {
    h1 = Math.min(h1, lim.hsaSelfOnly);
    h2 = 0;
  }

  const iraCap = lim.traditionalIraContribution;
  const i1 = Math.min(toMoneyValue(input.traditionalIraSpouse1), iraCap);
  const i2 = joint ? Math.min(toMoneyValue(input.traditionalIraSpouse2), iraCap) : 0;

  return {
    ...input,
    preTax401kSpouse1: p1,
    preTax401kSpouse2: joint ? p2 : 0,
    preTaxHsaSpouse1: h1,
    preTaxHsaSpouse2: joint ? h2 : 0,
    traditionalIraSpouse1: i1,
    traditionalIraSpouse2: joint ? i2 : 0,
  };
}
