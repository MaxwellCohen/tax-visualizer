import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import { aggregatePretaxFromSources } from "~/lib/taxCalc.pretaxBenefitSource";
import { getFederalTaxCreditCaps, getItemizedDeductionCaps, getPretaxLimits, getTaxYearConfig } from "~/lib/taxData";

export function createLimitMemos(values: Accessor<TaxInput>) {
  const selectedTaxConfig = createMemo(() => getTaxYearConfig(values().taxYear));
  const pretaxLimits = createMemo(() => getPretaxLimits(values().taxYear));
  const itemizedCaps = createMemo(() => getItemizedDeductionCaps(values().taxYear));
  const federalTaxCreditCaps = createMemo(() => getFederalTaxCreditCaps(values().taxYear));
  const isMarriedJoint = createMemo(() => values().filingStatus === "marriedJoint");
  const preTaxBenefitsTotal = createMemo(() => {
    const v = values();
    const j = v.filingStatus === "marriedJoint";
    const pt = aggregatePretaxFromSources(v.pretaxBenefitSources, j);
    const k401 = pt.preTax401kSpouse1 + (j ? pt.preTax401kSpouse2 : 0);
    const hsa = pt.preTaxHsaSpouse1 + (j ? pt.preTaxHsaSpouse2 : 0);
    return k401 + hsa + pt.preTaxOther;
  });

  const maxElective401 = createMemo(() => pretaxLimits()?.electiveDeferral401k);
  const maxIraContribution = createMemo(() => pretaxLimits()?.traditionalIraContribution);
  const maxHsaSpouse1 = createMemo(() => {
    const lim = pretaxLimits();
    if (!lim) return undefined;
    if (!isMarriedJoint()) return lim.hsaSelfOnly;
    const pt = aggregatePretaxFromSources(values().pretaxBenefitSources, true);
    return Math.max(0, lim.hsaFamily - pt.preTaxHsaSpouse2);
  });
  const maxHsaSpouse2 = createMemo(() => {
    const lim = pretaxLimits();
    if (!lim || !isMarriedJoint()) return undefined;
    const pt = aggregatePretaxFromSources(values().pretaxBenefitSources, true);
    return Math.max(0, lim.hsaFamily - pt.preTaxHsaSpouse1);
  });

  return {
    selectedTaxConfig,
    pretaxLimits,
    itemizedCaps,
    federalTaxCreditCaps,
    isMarriedJoint,
    preTaxBenefitsTotal,
    maxElective401,
    maxIraContribution,
    maxHsaSpouse1,
    maxHsaSpouse2,
  };
}
