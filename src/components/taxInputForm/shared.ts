import type { FilingStatus } from "~/lib/taxData";
import type { configItem } from "~/lib/config/page/pageConfig.types";

export const filingStatusOptions: Array<{ value: FilingStatus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married filing jointly" },
  { value: "marriedSeparate", label: "Married filing separately" },
  { value: "headOfHousehold", label: "Head of household" },
];

export function incomeKindSelectOptions(items: configItem[], isMarriedJoint: boolean): Array<{ value: string; label: string }> {
  return items
    .filter(item => item.inputRowSettings?.category === "income")
    .flatMap(item => {
      const subs = item.inputRowSettings?.subcategories ?? [];
      return subs.map(sub => ({
        value: sub.key,
        label: isMarriedJoint ? sub.labelJoint : sub.labelSingle,
      }));
    });
}

export function parseCurrencyInput(rawValue: string): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export const inputClass =
  "w-full rounded-md border-0 px-3 py-2.5 text-sm outline-none transition-shadow duration-150 focus:ring-2 focus:ring-[var(--accent)]";
export const labelClass = "flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide";

/** Income + pre-tax tables (see `TaxInputFormIncomeSection`, `PretaxBenefitSourceFields`). */
export const taxInputFormTableThClass =
  "pb-2 pr-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-(--text-faint) md:border-b md:border-(--border) md:bg-(--surface) md:border-r md:border-(--border-subtle) md:last:border-r-0";

export const taxInputFormTableTdLabeled =
  "py-2 pr-3 max-md:grid max-md:grid-cols-[minmax(5.25rem,6.75rem)_minmax(0,1fr)] max-md:gap-x-3 max-md:gap-y-1 max-md:items-start max-md:border-t max-md:border-(--border-subtle) max-md:px-0 max-md:py-2 max-md:first:border-t-0 max-md:first:pt-0 max-md:before:block max-md:before:content-[attr(data-label)] max-md:before:pt-[0.45rem] max-md:before:text-[0.65rem] max-md:before:font-semibold max-md:before:uppercase max-md:before:tracking-[0.12em] max-md:before:text-(--text-faint) max-md:before:[font-family:var(--font-heading)] md:align-top md:border-b md:border-r md:border-(--border-subtle) md:last:border-r-0";

export const taxInputFormTableTdActions =
  "whitespace-nowrap py-2 pl-1 pr-3 text-right align-bottom max-md:flex max-md:items-center max-md:justify-end max-md:border-t max-md:border-(--border-subtle) max-md:px-0 max-md:py-2 max-md:pb-0 md:align-top md:border-b md:border-r md:border-(--border-subtle) md:last:border-r-0";

export const taxInputFormTableTrClass =
  "align-top transition-colors max-md:mb-3 max-md:block max-md:rounded-lg max-md:border max-md:border-(--border) max-md:bg-(--surface) max-md:p-3 max-md:last:mb-0 md:border-0";

/** Helper text under pre-tax numeric fields (401(k), HSA, IRA). */
export const pretaxFieldCaptionClass =
  "text-[0.65rem] font-normal normal-case tracking-normal";

export { money } from "~/lib/moneyFormat";

/** Dropdown options for pretax rows; filters out empty labels based on filing status. */
export function pretaxBenefitKindSelectOptions(
  items: configItem[],
  isMarriedJoint: boolean
): Array<{ value: string; label: string }> {
  return items
    .filter(item => item.inputRowSettings?.category === "pretax")
    .flatMap(item => {
      const subs = item.inputRowSettings?.subcategories ?? [];
      return subs.map(sub => ({
        value: sub.key,
        label: isMarriedJoint ? sub.labelJoint : sub.labelSingle,
      }));
    })
    .filter(opt => opt.label.length > 0);
}

export function itemizedDeductionSelectOptions(
  category: string,
  items: configItem[]
): Array<{ value: string; label: string }> {
  return items
    .filter(item => item.inputRowSettings?.category === category && item.inputRowSettings?.subcategories)
    .flatMap(item => {
      const subs = item.inputRowSettings?.subcategories ?? [];
      return subs.map(sub => ({
        value: sub.key,
        label: sub.labelSingle,
      }));
    });
}
//"credit"
