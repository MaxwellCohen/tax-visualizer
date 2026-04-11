import { createEffect } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import { clampTaxInputPretaxToLimits } from "~/lib/taxCalc.clamp";
import type { TaxInput } from "~/lib/taxCalc";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";

export function wirePretaxCapEffect(
  form: FormApi<TaxInput, undefined>,
  values: Accessor<TaxInput>,
  pretaxLimits: Accessor<PretaxBenefitLimits | null>,
): void {
  createEffect(() => {
    pretaxLimits();
    const v = values();
    const next = clampTaxInputPretaxToLimits(v);
    if (JSON.stringify(next.pretaxBenefitSources) === JSON.stringify(v.pretaxBenefitSources)) {
      return;
    }
    form.setFieldValue("pretaxBenefitSources", next.pretaxBenefitSources);
  });
}
