export { calculateTaxes } from "~/lib/taxCalc.calculateTaxes";
export { clampTaxInputPretaxToLimits } from "~/lib/taxCalc.clamp";
export { incomeSourceDisplayLabel, newIncomeSource } from "~/lib/taxCalc.incomeSource";
export type {
  DeductionKind,
  IncomeKind,
  IncomeSource,
  TaxInput,
  TaxResult,
  TaxSegment,
  TaxSegmentKind,
} from "~/lib/taxCalc.types";
