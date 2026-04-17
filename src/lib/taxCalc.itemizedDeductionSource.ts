import type { ItemizedDeductionSource } from "~/lib/taxCalc.types";

export const ITEMIZED_DEDUCTION_KIND_VALUES: string[] = [
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