import {
  emptyAggregatedPretax,
  newFederalTaxCreditSource,
  newIncomeSource,
  newItemizedDeductionSource,
  pretaxScalarsToMinimalSources,
  type TaxInput,
} from "~/lib/taxCalc";
import {
  deserializeScenarioInput,
  serializeScenarioInput,
} from "~/lib/taxScenario";

export function starterScenario(taxYear: number): TaxInput {
  return {
    taxYear,
    filingStatus: "single",
    incomeSources: [newIncomeSource({ kind: "wages", amount: 90_000 })],
    pretaxBenefitSources: pretaxScalarsToMinimalSources(emptyAggregatedPretax()),
    useItemizedDeductions: false,
    itemizedDeductions: [newItemizedDeductionSource()],
    federalTaxCredits: [newFederalTaxCreditSource()],
  };
}

export function cloneScenario(input: TaxInput, availableYears: number[], fallbackYear: number): TaxInput {
  return (
    deserializeScenarioInput(serializeScenarioInput(input), availableYears, fallbackYear) ??
    starterScenario(fallbackYear)
  );
}
