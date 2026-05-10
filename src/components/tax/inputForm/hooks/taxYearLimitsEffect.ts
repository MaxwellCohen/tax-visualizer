import { createEffect, type Accessor, type Setter } from "solid-js";
import { clampTaxFormData } from "~/lib/taxCalc.clamp";
import type { TaxFormData } from "~/lib/taxForm.types";
import { pruneDisallowedLineItemKinds } from "~/lib/taxScenario.pruneLineItemKinds";
import { taxFormDataEquals } from "~/components/tax/inputForm/hooks/taxInputRowActions";

/** Keeps line-item kinds aligned with config, then pretax/SALT/credit amounts within `getTaxYearConfig` limits. */
export function wireTaxYearLimitsEffect(
  taxInput: Accessor<TaxFormData>,
  setTaxInput: Setter<TaxFormData>,
): void {
  createEffect(() => {
    taxInput();
    setTaxInput((prev) => {
      const pruned = pruneDisallowedLineItemKinds(prev.rows);
      const next = clampTaxFormData({ rows: pruned });
      if (taxFormDataEquals({ rows: prev.rows }, { rows: next.rows })) return prev;
      return { ...prev, rows: next.rows };
    });
  });
}
