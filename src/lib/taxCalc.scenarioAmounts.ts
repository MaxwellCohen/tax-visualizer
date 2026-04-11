import type { TaxInput } from "~/lib/taxCalc.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { normalizeSourcesAndIncomeTotals, type IncomeTotals } from "~/lib/taxCalc.scenarioAmountsIncome";
import { computePretaxIraSlice } from "~/lib/taxCalc.scenarioAmountsPretaxIra";
import type { PretaxIraSlice } from "~/lib/taxCalc.scenarioPretaxIra.types";

export type PreparedScenarioAmounts = IncomeTotals & PretaxIraSlice;

export function prepareScenarioAmounts(input: TaxInput, config: TaxYearConfig): PreparedScenarioAmounts {
  const inc = normalizeSourcesAndIncomeTotals(input);
  const slice = computePretaxIraSlice(input, config, inc);
  return { ...inc, ...slice };
}
