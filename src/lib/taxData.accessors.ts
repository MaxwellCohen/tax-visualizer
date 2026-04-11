import { TAX_DATA_BY_YEAR } from "~/lib/taxData.constants";
import type { PretaxBenefitLimits, TaxYearConfig } from "~/lib/taxData.types";

export function getAvailableTaxYears(): number[] {
  return Object.keys(TAX_DATA_BY_YEAR)
    .map(Number)
    .sort((a, b) => b - a);
}

export function getTaxYearConfig(taxYear: number): TaxYearConfig | null {
  return TAX_DATA_BY_YEAR[taxYear] ?? null;
}

export function isPlanningTaxYear(taxYear: number): boolean {
  return getTaxYearConfig(taxYear)?.status === "planning";
}

/** Contribution caps (401(k), HSA, IRA) for `taxYear`, or null if the year is not modeled. */
export function getPretaxLimits(taxYear: number): PretaxBenefitLimits | null {
  return getTaxYearConfig(taxYear)?.pretaxLimits ?? null;
}
