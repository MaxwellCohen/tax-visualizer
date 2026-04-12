import { FORM_CREDIT_ITEMS, type FormInputItem } from "~/lib/config/taxItems";
import { money } from "~/lib/moneyFormat";
import type { FederalTaxCreditCaps } from "~/lib/taxData.types";

export type FederalTaxCreditKindDetail = {
  description: string;
  modelingNote: string;
};

function creditCapSuffix(kind: string, caps: FederalTaxCreditCaps | null): string {
  if (!caps) return " Choose a tax year to show modeled entry ceilings from tax tables.";
  const n = caps[kind as keyof FederalTaxCreditCaps];
  if (n >= 100_000_000) {
    return " No separate dollar ceiling in the model for this category (still limited by federal tax before credits).";
  }
  return ` Modeled max total for rows of this kind: ${money.format(n)} (selected tax year).`;
}

export function getFederalTaxCreditKindDetail(
  kind: string,
  caps: FederalTaxCreditCaps | null,
): FederalTaxCreditKindDetail {
  const item = FORM_CREDIT_ITEMS.find((i) => i.id === kind) as FormInputItem | undefined;
  if (!item) {
    return {
      description: "Unknown credit type",
      modelingNote: "No configuration available for this credit type.",
    };
  }
  
  return {
    description: item.description || "",
    modelingNote: creditCapSuffix(kind, caps),
  };
}