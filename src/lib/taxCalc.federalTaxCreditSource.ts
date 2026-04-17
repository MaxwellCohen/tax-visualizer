import type { FederalTaxCreditSource } from "~/lib/taxCalc.types";

export const FEDERAL_TAX_CREDIT_KIND_VALUES = [
  "childTaxCredit-childTaxCredit",
  "childTaxCredit-creditForOtherDependents",
  "educationCredits-educationCredits",
  "retirementSavingsContributions-retirementSavingsContributions",
  "otherFederalCredit-otherFederalCredit",
  "otherFederalCredit-childAndDependentCare",
  "otherFederalCredit-foreignTaxCredit",
  "otherFederalCredit-residentialCleanEnergy",
  "otherFederalCredit-electricVehicleCredit",
  "otherFederalCredit-generalBusinessCredit",
];

export function newFederalTaxCreditSource(
  overrides?: Partial<Omit<FederalTaxCreditSource, "id">>
): FederalTaxCreditSource {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `crd-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    kind: "childTaxCredit-childTaxCredit",
    label: "",
    amount: 0,
    ...overrides,
  };
}