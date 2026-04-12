import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import { sumLabeledAmountSources } from "~/lib/taxCalc.labeledAmountSource";
import type { TaxYearConfig } from "~/lib/taxData.types";

export function createDeductionMemos(
  values: Accessor<TaxInput>,
  selectedTaxConfig: Accessor<TaxYearConfig | null>,
) {
  const standardDeduction = createMemo(
    () => selectedTaxConfig()?.standardDeduction[values().filingStatus] ?? 0,
  );
  const itemizedBeatsStandard = createMemo(
    () => sumLabeledAmountSources(values().itemizedDeductions) >= standardDeduction(),
  );
  return { standardDeduction, itemizedBeatsStandard };
}
