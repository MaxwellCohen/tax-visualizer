import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import type { TaxFormData } from "~/lib/taxForm.types";
import { sumLabeledAmountSources } from "~/lib/taxCalc.labeledAmountSource";
import type { TaxYearConfig } from "~/lib/taxData.types";

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
