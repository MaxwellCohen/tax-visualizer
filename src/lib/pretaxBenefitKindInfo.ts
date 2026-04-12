import { FORM_PRETAX_ITEMS, type FormInputItem } from "~/lib/config/taxItems";
import { money } from "~/lib/moneyFormat";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";

export type PretaxBenefitKindDetail = {
  description: string;
  limitNote: string;
};

const PRETAX_MODELING_NOTES: Record<string, string> = {
  "401k": "elective deferral per employee (catch-up not modeled)",
  "hsa": "payroll HSA contributions toward HDHP limits",
  "other": "miscellaneous payroll amounts taken pre-tax",
  "traditionalIra": "Traditional IRA (deductible in this flow)",
};

export function getPretaxBenefitKindDetail(
  kind: string,
  limits: PretaxBenefitLimits | null,
  joint: boolean,
): PretaxBenefitKindDetail {
  const item = FORM_PRETAX_ITEMS.find((i) => i.id === kind) as FormInputItem | undefined;
  if (!item) {
    return {
      description: "Unknown pretax benefit type",
      limitNote: "No configuration available for this benefit type.",
    };
  }
  
  const fmt = (n: number) => money.format(n);
  const needYear = "Choose a tax year to show limits from this app's IRS figures.";
  
  const modelingNote = PRETAX_MODELING_NOTES[kind] || "";
  let limitNote = modelingNote;
  
  if (kind === "hsa" && limits) {
    limitNote = joint
      ? `Family HDHP combined payroll cap ${fmt(limits.hsaFamily)}; self-only up to ${fmt(limits.hsaSelfOnly)} per spouse.`
      : `Self-only HDHP cap ${fmt(limits.hsaSelfOnly)}. Family combined cap is ${fmt(limits.hsaFamily)} when filing jointly.`;
  } else if (!limitNote) {
    limitNote = needYear;
  }
  
  return {
    description: item.description || "",
    limitNote,
  };
}