import type { TaxInput } from "~/lib/taxCalc.types";
import type { TaxCalculationInputs } from "~/lib/taxConfig.types";

export function normalizeFormInputs(input: TaxInput): TaxCalculationInputs {
  return {
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: input.incomeSources.map((source) => ({
      id: source.id,
      kind: source.kind,
      label: source.label,
      amount: source.amount,
    })),
    pretaxBenefitSources: input.pretaxBenefitSources.map((benefit) => ({
      id: benefit.id,
      kind: benefit.kind,
      label: benefit.label || "",
      amount: benefit.amount,
    })),
    useItemizedDeductions: input.useItemizedDeductions,
    itemizedDeductions: input.itemizedDeductions.map((deduction) => ({
      id: deduction.id,
      kind: deduction.kind,
      label: deduction.label,
      amount: deduction.amount,
    })),
    federalTaxCredits: input.federalTaxCredits.map((credit) => ({
      id: credit.id,
      kind: credit.kind,
      label: credit.label,
      amount: credit.amount,
    })),
  };
}