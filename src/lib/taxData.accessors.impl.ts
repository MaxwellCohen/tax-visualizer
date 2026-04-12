import { getYearValues, YEAR_VALUES_BY_YEAR } from "~/lib/config/yearValues";
import { getTaxYearStatus, yearValuesToTaxYearConfig } from "~/lib/taxData.fromYearValues";
import type {
  FederalTaxCreditCaps,
  ItemizedDeductionCaps,
  PretaxBenefitLimits,
  TaxYearConfig,
} from "~/lib/taxData.types";

export function getAvailableTaxYears(): number[] {
  return Object.keys(YEAR_VALUES_BY_YEAR)
    .map(Number)
    .sort((a, b) => b - a);
}

export function getTaxYearConfig(taxYear: number): TaxYearConfig | null {
  const yv = getYearValues(taxYear);
  if (!yv) {
    return null;
  }
  return yearValuesToTaxYearConfig(yv, getTaxYearStatus(taxYear));
}

export function isPlanningTaxYear(taxYear: number): boolean {
  return getTaxYearConfig(taxYear)?.status === "planning";
}

/** Contribution caps (401(k), HSA, IRA) for `taxYear`, or null if the year is not modeled. */
export function getPretaxLimits(taxYear: number): PretaxBenefitLimits | null {
  return getTaxYearConfig(taxYear)?.pretaxLimits ?? null;
}

/** Schedule A caps (e.g. SALT) for `taxYear`, or null if the year is not modeled. */
export function getItemizedDeductionCaps(taxYear: number): ItemizedDeductionCaps | null {
  return getTaxYearConfig(taxYear)?.itemizedCaps ?? null;
}

/** Modeled per-credit entry ceilings for `taxYear`, or null if the year is not modeled. */
export function getFederalTaxCreditCaps(taxYear: number): FederalTaxCreditCaps | null {
  return getTaxYearConfig(taxYear)?.federalTaxCreditCaps ?? null;
}
