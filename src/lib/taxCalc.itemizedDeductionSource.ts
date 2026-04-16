import type { ItemizedDeductionSource, ItemizedDeductionKind } from "~/lib/taxCalc.types";

export const ITEMIZED_DEDUCTION_KIND_VALUES: ItemizedDeductionKind[] = [
  "medicalDental-medicalDental",
  "salt-salt",
  "mortgageInterest-mortgageInterest",
  "charitable-charitable",
  "investmentInterest",
  "casualtyTheft",
  "otherItemized",
];

export function newItemizedDeductionSource(
  overrides?: Partial<Omit<ItemizedDeductionSource, "id">>
): ItemizedDeductionSource {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `itm-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    kind: "otherItemized",
    label: "",
    amount: 0,
    ...overrides,
  };
}