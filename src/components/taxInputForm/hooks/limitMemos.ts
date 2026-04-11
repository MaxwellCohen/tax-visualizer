import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import { getPretaxLimits, getTaxYearConfig } from "~/lib/taxData";

export function createLimitMemos(values: Accessor<TaxInput>) {
  const selectedTaxConfig = createMemo(() => getTaxYearConfig(values().taxYear));
  const pretaxLimits = createMemo(() => getPretaxLimits(values().taxYear));
  const isMarriedJoint = createMemo(() => values().filingStatus === "marriedJoint");
  const preTaxBenefitsTotal = createMemo(() => {
    const v = values();
    const j = v.filingStatus === "marriedJoint";
    const k401 = v.preTax401kSpouse1 + (j ? v.preTax401kSpouse2 : 0);
    const hsa = v.preTaxHsaSpouse1 + (j ? v.preTaxHsaSpouse2 : 0);
    return k401 + hsa + v.preTaxOther;
  });

  const maxElective401 = createMemo(() => pretaxLimits()?.electiveDeferral401k);
  const maxIraContribution = createMemo(() => pretaxLimits()?.traditionalIraContribution);
  const maxHsaSpouse1 = createMemo(() => {
    const lim = pretaxLimits();
    if (!lim) return undefined;
    if (!isMarriedJoint()) return lim.hsaSelfOnly;
    return Math.max(0, lim.hsaFamily - values().preTaxHsaSpouse2);
  });
  const maxHsaSpouse2 = createMemo(() => {
    const lim = pretaxLimits();
    if (!lim || !isMarriedJoint()) return undefined;
    return Math.max(0, lim.hsaFamily - values().preTaxHsaSpouse1);
  });

  return {
    selectedTaxConfig,
    pretaxLimits,
    isMarriedJoint,
    preTaxBenefitsTotal,
    maxElective401,
    maxIraContribution,
    maxHsaSpouse1,
    maxHsaSpouse2,
  };
}
