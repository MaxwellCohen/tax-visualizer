import {
  newFederalTaxCreditSource,
  newIncomeSource,
  newItemizedDeductionSource,
  newPretaxBenefitSource,
  type TaxInput,
} from "~/lib/taxCalc";
import { pretaxScalarsToMinimalSources } from "~/lib/taxCalc.pretaxBenefitSource";
import type { AggregatedPretax } from "~/lib/taxCalc.pretaxBenefitSource";

export function baseInput(overrides: Partial<TaxInput> = {}): TaxInput {
  return {
    taxYear: 2025,
    filingStatus: "single",
    incomeSources: [newIncomeSource({ kind: "wages", amount: 50_000 })],
    pretaxBenefitSources: [newPretaxBenefitSource({ kind: "preTax401kSpouse1" })],
    useItemizedDeductions: false,
    itemizedDeductions: [newItemizedDeductionSource()],
    federalTaxCredits: [newFederalTaxCreditSource()],
    ...overrides,
  };
}

/** Test helper: build `pretaxBenefitSources` from aggregated amounts (one row per non-zero kind). */
export function withPretaxTotals(p: Partial<AggregatedPretax>): TaxInput["pretaxBenefitSources"] {
  const full: AggregatedPretax = {
    preTax401kSpouse1: 0,
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
    ...p,
  };
  return pretaxScalarsToMinimalSources(full);
}

/** One line with the given total (for tests that previously passed a scalar). */
export function withItemizedTotal(amount: number): TaxInput["itemizedDeductions"] {
  return [newItemizedDeductionSource({ amount })];
}

export function withFederalCreditsTotal(amount: number): TaxInput["federalTaxCredits"] {
  return [newFederalTaxCreditSource({ amount })];
}
