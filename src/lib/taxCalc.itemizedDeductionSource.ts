import type { ItemizedDeductionKind, ItemizedDeductionSource } from "~/lib/taxCalc.types";

export const ITEMIZED_DEDUCTION_KIND_VALUES: readonly ItemizedDeductionKind[] = [
  "medicalDental",
  "salt",
  "mortgageInterest",
  "investmentInterest",
  "charitable",
  "casualtyTheft",
  "otherItemized",
];

export { newItemizedDeductionSource } from "~/lib/taxCalc.types";