import { newIncomeSource, newPretaxBenefitSource, type TaxInput } from "~/lib/taxCalc";
import {
  deserializeScenarioInput,
  serializeScenarioInput,
} from "~/lib/taxScenario";

export function starterScenario(taxYear: number): TaxInput {
  return {
    taxYear,
    filingStatus: "single",
    incomeSources: [newIncomeSource({ kind: "wages", amount: 90_000 })],
    pretaxBenefitSources: [newPretaxBenefitSource({ kind: "preTax401kSpouse1" })],
    useItemizedDeductions: false,
    itemizedDeductions: 0,
  };
}

export function cloneScenario(input: TaxInput, availableYears: number[], fallbackYear: number): TaxInput {
  return (
    deserializeScenarioInput(serializeScenarioInput(input), availableYears, fallbackYear) ??
    starterScenario(fallbackYear)
  );
}
