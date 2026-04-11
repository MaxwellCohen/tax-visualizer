import { newIncomeSource, type TaxInput } from "~/lib/taxCalc";
import {
  deserializeScenarioInput,
  serializeScenarioInput,
} from "~/lib/taxScenario";

export function starterScenario(taxYear: number): TaxInput {
  return {
    taxYear,
    filingStatus: "single",
    incomeSources: [newIncomeSource({ kind: "wages", amount: 90_000 })],
    preTax401kSpouse1: 0,
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
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
