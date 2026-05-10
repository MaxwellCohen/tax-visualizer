import { DEFAULT_ITEMIZED_DEDUCTION_KIND } from "~/lib/config/taxPage/inputKindKeys";
import type { ItemizedDeductionSource } from "~/lib/tax/calc/types";


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