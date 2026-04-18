import { createEffect } from "solid-js";
import type { Accessor } from "solid-js";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { clampTaxFormData } from "~/lib/taxCalc.clamp";
import type { TaxFormData } from "~/lib/taxForm.types";
import { pruneDisallowedLineItemKinds } from "~/lib/taxScenario.pruneLineItemKinds";

/** Keeps line-item kinds aligned with config, then pretax/SALT/credit amounts within `getTaxYearConfig` limits. */
export function wireTaxYearLimitsEffect(
  form: TaxInputFormApi,
  values: Accessor<TaxFormData>,
): void {
  createEffect(() => {
    const v = values();
    const pruned = pruneDisallowedLineItemKinds(v.rows);
    const next = clampTaxFormData({ rows: pruned });
    if (JSON.stringify(next.rows) === JSON.stringify(v.rows)) return;
    void form.setFieldValue("rows", next.rows);
  });
}
