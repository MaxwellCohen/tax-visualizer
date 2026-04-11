import { createEffect } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";

export function wirePretaxCapEffect(
  form: FormApi<TaxInput, undefined>,
  values: Accessor<TaxInput>,
  pretaxLimits: Accessor<PretaxBenefitLimits | null>,
): void {
  createEffect(() => {
    const lim = pretaxLimits();
    if (!lim) return;
    const v = values();
    const cap = lim.electiveDeferral401k;
    const j = v.filingStatus === "marriedJoint";

    const p1 = Math.min(v.preTax401kSpouse1, cap);
    if (p1 !== v.preTax401kSpouse1) {
      form.setFieldValue("preTax401kSpouse1", p1);
    }

    if (j) {
      const p2 = Math.min(v.preTax401kSpouse2, cap);
      if (p2 !== v.preTax401kSpouse2) {
        form.setFieldValue("preTax401kSpouse2", p2);
      }
      let h1 = Math.min(v.preTaxHsaSpouse1, lim.hsaFamily);
      let h2 = Math.min(v.preTaxHsaSpouse2, Math.max(0, lim.hsaFamily - h1));
      if (h1 !== v.preTaxHsaSpouse1) {
        form.setFieldValue("preTaxHsaSpouse1", h1);
      }
      if (h2 !== v.preTaxHsaSpouse2) {
        form.setFieldValue("preTaxHsaSpouse2", h2);
      }
    } else {
      const h1 = Math.min(v.preTaxHsaSpouse1, lim.hsaSelfOnly);
      if (h1 !== v.preTaxHsaSpouse1) {
        form.setFieldValue("preTaxHsaSpouse1", h1);
      }
      if (v.preTax401kSpouse2 !== 0) {
        form.setFieldValue("preTax401kSpouse2", 0);
      }
      if (v.preTaxHsaSpouse2 !== 0) {
        form.setFieldValue("preTaxHsaSpouse2", 0);
      }
    }

    const iraCap = lim.traditionalIraContribution;
    const ir1 = Math.min(v.traditionalIraSpouse1, iraCap);
    if (ir1 !== v.traditionalIraSpouse1) {
      form.setFieldValue("traditionalIraSpouse1", ir1);
    }
    if (j) {
      const ir2 = Math.min(v.traditionalIraSpouse2, iraCap);
      if (ir2 !== v.traditionalIraSpouse2) {
        form.setFieldValue("traditionalIraSpouse2", ir2);
      }
    } else if (v.traditionalIraSpouse2 !== 0) {
      form.setFieldValue("traditionalIraSpouse2", 0);
    }
  });
}
