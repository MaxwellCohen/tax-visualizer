export {
  getAvailableTaxYears,
  getFederalTaxCreditCaps,
  getItemizedDeductionCaps,
  getPretaxLimits,
  getTaxYearConfig,
  isPlanningTaxYear,
} from "~/lib/taxData.accessors";
export { getTaxYearStatus,  yearValuesToTaxYearConfig } from "~/lib/taxData.fromYearValues";
export type { FilingStatus } from "~/lib/taxData.types";
