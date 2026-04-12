import { createEffect } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import { clampTaxInputToYearLimits } from "~/lib/taxCalc.clamp";
import type { TaxInput } from "~/lib/taxCalc";

/** Keeps pretax, SALT, and federal credit rows within `TAX_DATA_BY_YEAR` limits when inputs change. */
export function wireTaxYearLimitsEffect(
  form: FormApi<TaxInput, undefined>,
  values: Accessor<TaxInput>,
): void {
  createEffect(() => {
    const v = values();
    const next = clampTaxInputToYearLimits(v);
    const p =
      JSON.stringify(next.pretaxBenefitSources) === JSON.stringify(v.pretaxBenefitSources);
    const i = JSON.stringify(next.itemizedDeductions) === JSON.stringify(v.itemizedDeductions);
    const f = JSON.stringify(next.federalTaxCredits) === JSON.stringify(v.federalTaxCredits);
    if (p && i && f) return;
    if (!p) void form.setFieldValue("pretaxBenefitSources", next.pretaxBenefitSources);
    if (!i) void form.setFieldValue("itemizedDeductions", next.itemizedDeductions);
    if (!f) void form.setFieldValue("federalTaxCredits", next.federalTaxCredits);
  });
}
