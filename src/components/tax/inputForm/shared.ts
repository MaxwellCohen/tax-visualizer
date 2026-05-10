import type { FilingStatus } from "~/lib/tax/data/types";
import type { ConfigItem, SubcategoryConfig } from "~/lib/config/taxPage/types";

type SelectOption = { value: string; label: string };

export const filingStatusOptions: Array<{ value: FilingStatus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married filing jointly" },
  { value: "marriedSeparate", label: "Married filing separately" },
  { value: "headOfHousehold", label: "Head of household" },
];

export function incomeKindSelectOptions(items: ConfigItem[], isMarriedJoint: boolean): SelectOption[] {
  return subcategorySelectOptions(items, "income", {
    labelForSubcategory: sub => (isMarriedJoint ? sub.labelJoint : sub.labelSingle),
    includeSubcategory: sub => isMarriedJoint || !isSecondSpouseSubKey(sub.key),
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
  "w-full rounded-md border-0 px-3 py-2.5 text-sm outline-none transition-shadow duration-150 focus:ring-2 focus:ring-[var(--color-accent)]";
export const labelClass = "flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide";

/** Income + pre-tax tables (see `IncomeSection`, `PretaxBenefitSourceRow`). */
export const taxInputFormTableThClass =
  "pb-2 pr-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-(--color-faint-foreground) md:border-b md:border-(--color-border) md:bg-(--color-surface) md:border-r md:border-(--color-border-subtle) md:last:border-r-0";

export const taxInputFormTableTdLabeled =
  "py-2 pr-3 max-md:grid max-md:grid-cols-[minmax(5.25rem,6.75rem)_minmax(0,1fr)] max-md:gap-x-3 max-md:gap-y-1 max-md:items-start max-md:border-t max-md:border-(--color-border-subtle) max-md:px-0 max-md:py-2 max-md:first:border-t-0 max-md:first:pt-0 max-md:before:block max-md:before:content-[attr(data-label)] max-md:before:pt-[0.45rem] max-md:before:text-[0.65rem] max-md:before:font-semibold max-md:before:uppercase max-md:before:tracking-[0.12em] max-md:before:text-(--color-faint-foreground) max-md:before:[font-family:var(--font-heading)] md:align-top md:border-b md:border-r md:border-(--color-border-subtle) md:last:border-r-0";

export const taxInputFormTableTdActions =
  "whitespace-nowrap py-2 pl-1 pr-3 text-right align-bottom max-md:flex max-md:items-center max-md:justify-end max-md:border-t max-md:border-(--color-border-subtle) max-md:px-0 max-md:py-2 max-md:pb-0 md:align-top md:border-b md:border-r md:border-(--color-border-subtle) md:last:border-r-0";

export const taxInputFormTableTrClass =
  "align-top transition-colors max-md:mb-3 max-md:block max-md:rounded-lg max-md:border max-md:border-(--color-border) max-md:bg-(--color-surface) max-md:p-3 max-md:last:mb-0 md:border-0";

export const addLineBtnClass =
  "shrink-0 whitespace-nowrap rounded-md border border-(--color-border) bg-(--color-accent-muted) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--color-accent) transition-colors";

export const removeAllBtnClass =
  "shrink-0 whitespace-nowrap rounded-md border border-(--color-border) bg-(--color-surface-alt) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--color-muted-foreground) transition-colors hover:border-(--color-warning-text) hover:text-(--color-warning-text)";

/** Helper text under pre-tax numeric fields (401(k), HSA, IRA). */
export const pretaxFieldCaptionClass =
  "text-[0.65rem] font-normal normal-case tracking-normal";

function isSecondSpouseSubKey(key: string): boolean {
  return key.toLowerCase().includes("spouse2");
}

function subcategorySelectOptions(
  items: ConfigItem[],
  category: string,
  options: {
    labelForSubcategory: (subcategory: SubcategoryConfig) => string;
    includeSubcategory?: (subcategory: SubcategoryConfig) => boolean;
  }
): SelectOption[] {
  return items
    .filter(hasSubcategoriesForCategory(category))
    .flatMap(item =>
      item.input.subcategories
        .filter(options.includeSubcategory ?? (() => true))
        .map(sub => ({
          value: sub.key,
          label: options.labelForSubcategory(sub),
        }))
    )
    .filter(opt => opt.label.length > 0);
}

function hasSubcategoriesForCategory(
  category: string
): (item: ConfigItem) => item is ConfigItem & { input: { subcategories: SubcategoryConfig[] } } {
  return (item): item is ConfigItem & { input: { subcategories: SubcategoryConfig[] } } =>
    item.input?.category === category && Boolean(item.input.subcategories);
}

/** Dropdown options for pretax rows; filters out empty labels and MFJ-only spouse (2) lines when not filing jointly. */
export function pretaxBenefitKindSelectOptions(items: ConfigItem[], isMarriedJoint: boolean): SelectOption[] {
  return subcategorySelectOptions(items, "pretax", {
    labelForSubcategory: sub => (isMarriedJoint ? sub.labelJoint : sub.labelSingle),
    includeSubcategory: sub => isMarriedJoint || !isSecondSpouseSubKey(sub.key),
  });
}

export function itemizedDeductionSelectOptions(category: string, items: ConfigItem[]): SelectOption[] {
  return subcategorySelectOptions(items, category, {
    labelForSubcategory: sub => sub.labelSingle,
  });
}
