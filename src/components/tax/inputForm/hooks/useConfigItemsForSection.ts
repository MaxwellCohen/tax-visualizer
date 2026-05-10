import { createMemo, type Accessor } from "solid-js";
import { getInputItemsForSection } from "~/lib/config/taxPage/taxPage.config";
import type { ConfigItem } from "~/lib/config/taxPage/types";
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";

/** Memoized config items for a line-items section (income, pretax, deduction, credit). */
export function useConfigItemsForSection(
  taxData: Accessor<TaxYearConfig | null>,
  filingStatus: Accessor<FilingStatus>,
  sectionKey: Parameters<typeof getInputItemsForSection>[2],
): Accessor<ConfigItem[]> {
  return createMemo(() => {
    const td = taxData();
    const fs = filingStatus();
    if (!td) return [];
    return getInputItemsForSection(td, fs, sectionKey);
  });
}
