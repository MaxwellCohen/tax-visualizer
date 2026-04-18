import { DEFAULT_ITEMIZED_DEDUCTION_KIND } from "~/lib/config/page/inputKindKeys";
import type { ItemizedDeductionSource } from "~/lib/taxCalc.types";

/** Subcategory keys from `makeDeductionInputsConfig` itemized rows (for tests / validation). */
export const ITEMIZED_DEDUCTION_KIND_VALUES: string[] = [
  "deduction-salt-salt",
  "deduction-medicalDental-medicalDental",
  "deduction-mortgageInterest-mortgageInterest",
  "deduction-charitable-charitable",
];

export function newItemizedDeductionSource(
  overrides?: Partial<Omit<ItemizedDeductionSource, "id">>
): ItemizedDeductionSource {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `itm-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    kind: DEFAULT_ITEMIZED_DEDUCTION_KIND,
    label: "",
    amount: 0,
    ...overrides,
  };
}