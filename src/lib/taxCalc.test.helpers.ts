import { newIncomeSource, type TaxInput } from "~/lib/taxCalc";

export function baseInput(overrides: Partial<TaxInput> = {}): TaxInput {
  return {
    taxYear: 2025,
    filingStatus: "single",
    incomeSources: [newIncomeSource({ kind: "wages", amount: 50_000 })],
    preTax401kSpouse1: 0,
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
    useItemizedDeductions: false,
    itemizedDeductions: 0,
    ...overrides,
  };
}
