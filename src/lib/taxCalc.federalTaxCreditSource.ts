import type { FederalTaxCreditSource, FederalTaxCreditKind } from "~/lib/taxCalc.types";

export const FEDERAL_TAX_CREDIT_KIND_VALUES: FederalTaxCreditKind[] = [
  "childTaxCredit",
  "creditForOtherDependents",
  "childAndDependentCare",
  "educationCredits",
  "retirementSavingsContributions",
  "foreignTaxCredit",
  "residentialCleanEnergy",
  "electricVehicleCredit",
  "generalBusinessCredit",
  "otherFederalCredit",
];

export function newFederalTaxCreditSource(
  overrides?: Partial<Omit<FederalTaxCreditSource, "id">>
): FederalTaxCreditSource {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `crd-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    kind: "childTaxCredit",
    label: "",
    amount: 0,
    ...overrides,
  };
}