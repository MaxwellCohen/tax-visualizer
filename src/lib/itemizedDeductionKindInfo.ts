import { FORM_DEDUCTION_ITEMS, type FormInputItem } from "~/lib/config/taxItems";
import { money } from "~/lib/moneyFormat";
import type { FilingStatus, ItemizedDeductionCaps } from "~/lib/taxData.types";

export type ItemizedDeductionKindDetail = {
  description: string;
  modelingNote: string;
};

export function getItemizedDeductionKindDetail(
  kind: string,
  caps: ItemizedDeductionCaps | null,
  filingStatus: FilingStatus,
): ItemizedDeductionKindDetail {
  const item = FORM_DEDUCTION_ITEMS.find((i) => i.id === kind) as FormInputItem | undefined;
  if (!item) {
    return {
      description: "Unknown deduction type",
      modelingNote: "No configuration available for this deduction type.",
    };
  }
  
  let modelingNote = "";
  
  if (kind === "salt" && caps) {
    const saltNote = `Combined SALT lines for your filing status are capped at ${money.format(caps.saltMax[filingStatus])} for the selected tax year (from tax tables).`;
    modelingNote = `${saltNote} Amounts are scaled down proportionally across SALT rows if over the cap.`;
  }
  
  return {
    description: item.description || "",
    modelingNote,
  };
}