export { calculateTaxes } from "~/lib/taxCalc.calculateTaxes";
export { incomeSourceDisplayLabel, newIncomeSource } from "~/lib/taxCalc.incomeSource";
export {
  aggregatePretaxFromSources,
  newPretaxBenefitSource,
} from "~/lib/taxCalc.pretaxBenefitSource";
export type {
  IncomeKind,
  PretaxBenefitKind,
  PretaxBenefitSource,
  TaxInput,
  TaxResult,
  TaxSegment,
} from "~/lib/taxCalc.types";
