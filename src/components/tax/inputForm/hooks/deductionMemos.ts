import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import { rowsToTaxCalculationInputs } from "~/lib/tax/calc/inputs";
import type { TaxFormData } from "~/lib/tax/form/types";
import { sumLabeledAmountSources } from "~/lib/tax/calc/labeledAmountSource";
import type { TaxYearConfig } from "~/lib/tax/data/types";

export function createDeductionMemos(
  values: Accessor<TaxFormData>,
  selectedTaxConfig: Accessor<TaxYearConfig | null>,
) {
  const calcInputs = createMemo(() => rowsToTaxCalculationInputs(values().rows));
  const standardDeduction = createMemo(
    () => selectedTaxConfig()?.standardDeduction[calcInputs().filingStatus] ?? 0,
  );
  const itemizedBeatsStandard = createMemo(
    () => sumLabeledAmountSources(calcInputs().itemizedDeductions) >= standardDeduction(),
  );
  return { standardDeduction, itemizedBeatsStandard };
}
