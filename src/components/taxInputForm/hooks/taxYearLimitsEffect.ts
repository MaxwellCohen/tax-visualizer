import { createEffect } from "solid-js";
import type { Accessor } from "solid-js";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { clampTaxFormData } from "~/lib/taxCalc.clamp";
import type { TaxFormData } from "~/lib/taxForm.types";

/** Keeps pretax, SALT, and federal credit rows within `getTaxYearConfig` limits when inputs change. */
export function wireTaxYearLimitsEffect(
  form: TaxInputFormApi,
  values: Accessor<TaxFormData>,
): void {
  createEffect(() => {
    const v = values();
    const next = clampTaxFormData(v);
    if (JSON.stringify(next.rows) === JSON.stringify(v.rows)) return;
    void form.setFieldValue("rows", next.rows);
  });
}
