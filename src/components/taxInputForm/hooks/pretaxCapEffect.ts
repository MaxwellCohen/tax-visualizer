import { createEffect } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";

function setFieldIfDifferent<K extends keyof TaxInput>(
  form: FormApi<TaxInput, undefined>,
  key: K,
  next: TaxInput[K],
  current: TaxInput[K],
): void {
  if (next === current) return;
  form.setFieldValue(key, next);
}

function clamp401ForBothSpouses(
  form: FormApi<TaxInput, undefined>,
  v: TaxInput,
  cap: number,
  joint: boolean,
): void {
  const p1 = Math.min(v.preTax401kSpouse1, cap);
  setFieldIfDifferent(form, "preTax401kSpouse1", p1, v.preTax401kSpouse1);
  if (!joint) return;
  const p2 = Math.min(v.preTax401kSpouse2, cap);
  setFieldIfDifferent(form, "preTax401kSpouse2", p2, v.preTax401kSpouse2);
}

function clampHsaJoint(
  form: FormApi<TaxInput, undefined>,
  v: TaxInput,
  lim: PretaxBenefitLimits,
): void {
  const h1 = Math.min(v.preTaxHsaSpouse1, lim.hsaFamily);
  const h2 = Math.min(v.preTaxHsaSpouse2, Math.max(0, lim.hsaFamily - h1));
  setFieldIfDifferent(form, "preTaxHsaSpouse1", h1, v.preTaxHsaSpouse1);
  setFieldIfDifferent(form, "preTaxHsaSpouse2", h2, v.preTaxHsaSpouse2);
}

function clampHsaSingle(form: FormApi<TaxInput, undefined>, v: TaxInput, lim: PretaxBenefitLimits): void {
  const h1 = Math.min(v.preTaxHsaSpouse1, lim.hsaSelfOnly);
  setFieldIfDifferent(form, "preTaxHsaSpouse1", h1, v.preTaxHsaSpouse1);
  setFieldIfDifferent(form, "preTax401kSpouse2", 0, v.preTax401kSpouse2);
  setFieldIfDifferent(form, "preTaxHsaSpouse2", 0, v.preTaxHsaSpouse2);
}

function clampHsa(
  form: FormApi<TaxInput, undefined>,
  v: TaxInput,
  lim: PretaxBenefitLimits,
  joint: boolean,
): void {
  if (joint) {
    clampHsaJoint(form, v, lim);
    return;
  }
  clampHsaSingle(form, v, lim);
}

function clampTraditionalIra(
  form: FormApi<TaxInput, undefined>,
  v: TaxInput,
  iraCap: number,
  joint: boolean,
): void {
  const ir1 = Math.min(v.traditionalIraSpouse1, iraCap);
  setFieldIfDifferent(form, "traditionalIraSpouse1", ir1, v.traditionalIraSpouse1);
  if (joint) {
    const ir2 = Math.min(v.traditionalIraSpouse2, iraCap);
    setFieldIfDifferent(form, "traditionalIraSpouse2", ir2, v.traditionalIraSpouse2);
    return;
  }
  setFieldIfDifferent(form, "traditionalIraSpouse2", 0, v.traditionalIraSpouse2);
}

export function wirePretaxCapEffect(
  form: FormApi<TaxInput, undefined>,
  values: Accessor<TaxInput>,
  pretaxLimits: Accessor<PretaxBenefitLimits | null>,
): void {
  createEffect(() => {
    const lim = pretaxLimits();
    if (!lim) return;
    const v = values();
    const joint = v.filingStatus === "marriedJoint";

    clamp401ForBothSpouses(form, v, lim.electiveDeferral401k, joint);
    clampHsa(form, v, lim, joint);
    clampTraditionalIra(form, v, lim.traditionalIraContribution, joint);
  });
}
