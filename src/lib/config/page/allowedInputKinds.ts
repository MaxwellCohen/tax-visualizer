import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import { getInputItems } from "~/lib/config/page/Page.config";
import type { InputCategory } from "~/lib/config/page/pageConfig.types";

type AllowedLineItemKindSets = {
  income: Set<string>;
  pretax: Set<string>;
  deduction: Set<string>;
  credit: Set<string>;
};

/** Pretax subcategory keys for the second spouse — only valid when filing MFJ. */
function isPretaxSecondSpouseKey(key: string): boolean {
  return key.includes("Spouse2");
}

/**
 * Allowed `kind` strings per line-item category for a tax year and filing status,
 * matching dropdown options (including hiding pretax Spouse2 when not MFJ).
 */
export function getAllowedLineItemKindSets(
  taxData: TaxYearConfig,
  filingStatus: FilingStatus,
): AllowedLineItemKindSets {
  const items = getInputItems(taxData, filingStatus);
  const marriedJoint = filingStatus === "marriedJoint";

  const income = new Set<string>();
  const pretax = new Set<string>();
  const deduction = new Set<string>();
  const credit = new Set<string>();

  for (const item of items) {
    const cat = item.inputRowSettings?.category as InputCategory | undefined;
    const subs = item.inputRowSettings?.subcategories;
    if (!cat || !subs) continue;

    for (const sub of subs) {
      if (cat === "pretax" && !marriedJoint && isPretaxSecondSpouseKey(sub.key)) {
        continue;
      }
      if (cat === "income") income.add(sub.key);
      else if (cat === "pretax") pretax.add(sub.key);
      else if (cat === "deduction") deduction.add(sub.key);
      else if (cat === "credit") credit.add(sub.key);
    }
  }

  return { income, pretax, deduction, credit };
}
