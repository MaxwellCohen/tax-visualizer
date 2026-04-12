import { FORM_CREDIT_ITEMS } from "~/lib/config/taxItems";
import type { FederalTaxCreditKind, FederalTaxCreditSource } from "~/lib/taxCalc.types";

export const FEDERAL_TAX_CREDIT_KIND_VALUES: readonly FederalTaxCreditKind[] = [
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

const CREDIT_DISPLAY_NAMES: Record<string, string> = {
  childTaxCredit: "Child tax credit",
  creditForOtherDependents: "Credit for other dependents",
  childAndDependentCare: "Child and dependent care credit",
  educationCredits: "Education credits (AOTC / LLC)",
  retirementSavingsContributions: "Retirement savings contributions (saver's) credit",
  foreignTaxCredit: "Foreign tax credit",
  residentialCleanEnergy: "Residential clean energy credit",
  electricVehicleCredit: "Clean vehicle / EV credit",
  generalBusinessCredit: "General business credit",
  otherFederalCredit: "Other federal credit",
};

export type FedTaxCreditDisplayName = 
  | "Child tax credit"
  | "Credit for other dependents"
  | "Child and dependent care credit"
  | "Education credits (AOTC / LLC)"
  | "Retirement savings contributions (saver's) credit"
  | "Foreign tax credit"
  | "Residential clean energy credit"
  | "Clean vehicle / EV credit"
  | "General business credit"
  | "Other federal credit";

export function federalTaxCreditDisplayName(kind: FederalTaxCreditKind): FedTaxCreditDisplayName {
  return (CREDIT_DISPLAY_NAMES[kind] || "Other federal credit") as FedTaxCreditDisplayName;
}

export { newFederalTaxCreditSource } from "~/lib/taxCalc.types";