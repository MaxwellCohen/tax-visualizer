import { DEFAULT_FEDERAL_CREDIT_KIND } from "~/lib/config/taxPage/inputKindKeys";
import type { FederalTaxCreditSource } from "~/lib/tax/calc/types";

export function newFederalTaxCreditSource(
  overrides?: Partial<Omit<FederalTaxCreditSource, "id">>
): FederalTaxCreditSource {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `crd-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    kind: DEFAULT_FEDERAL_CREDIT_KIND,
    label: "",
    amount: 0,
    ...overrides,
  };
}