export {
  getAvailableTaxYears,
  getFederalTaxCreditCaps,
  getItemizedDeductionCaps,
  getPretaxLimits,
  getTaxYearConfig,
  isPlanningTaxYear,
} from "~/lib/taxData.accessors";
export { yearValuesToTaxYearConfig } from "~/lib/taxData.fromYearValues";
export type { FilingStatus } from "~/lib/taxData.types";
