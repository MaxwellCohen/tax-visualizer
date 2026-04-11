import type { FilingStatus } from "~/lib/taxData";
import type { IncomeKind, PretaxBenefitKind } from "~/lib/taxCalc";
import { isPretaxSpouse2Kind } from "~/lib/taxCalc.pretaxBenefitSource";

export const filingStatusOptions: Array<{ value: FilingStatus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married filing jointly" },
  { value: "marriedSeparate", label: "Married filing separately" },
  { value: "headOfHousehold", label: "Head of household" },
];

export const incomeKindOptions: Array<{ value: IncomeKind; label: string }> = [
  { value: "wages", label: "W-2 wages" },
  { value: "ordinary", label: "Other ordinary income" },
  { value: "shortTermCapGains", label: "Short-term capital gains" },
  { value: "longTermCapGains", label: "Long-term capital gains" },
];

export function parseCurrencyInput(rawValue: string): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function clampToMax(value: number, max: number): number {
  if (!Number.isFinite(max) || max < 0) return Math.max(0, value);
  return Math.min(Math.max(0, value), max);
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

export function labelForIncomeKind(kind: IncomeKind): string {
  return incomeKindOptions.find(o => o.value === kind)?.label ?? kind;
}

const pretaxBenefitLabels: Record<
  PretaxBenefitKind,
  { single: string; joint: string }
> = {
  preTax401kSpouse1: {
    single: "401(k) / 403(b)",
    joint: "401(k) / 403(b) — Spouse 1",
  },
  preTax401kSpouse2: {
    single: "",
    joint: "401(k) / 403(b) — Spouse 2",
  },
  preTaxHsaSpouse1: {
    single: "HSA (payroll)",
    joint: "HSA (payroll) — Spouse 1",
  },
  preTaxHsaSpouse2: {
    single: "",
    joint: "HSA (payroll) — Spouse 2",
  },
  preTaxOther: {
    single: "Other (FSA, transit, etc.)",
    joint: "Other (FSA, transit, etc.)",
  },
  traditionalIraSpouse1: {
    single: "Traditional IRA (deductible)",
    joint: "Traditional IRA — Spouse 1",
  },
  traditionalIraSpouse2: {
    single: "",
    joint: "Traditional IRA — Spouse 2",
  },
};

/** Dropdown options for pre-tax rows; spouse-2 kinds omitted unless filing jointly. */
export function pretaxBenefitKindSelectOptions(isMarriedJoint: boolean): Array<{
  value: PretaxBenefitKind;
  label: string;
}> {
  return (Object.keys(pretaxBenefitLabels) as PretaxBenefitKind[])
    .filter(k => isMarriedJoint || !isPretaxSpouse2Kind(k))
    .map(value => {
      const L = pretaxBenefitLabels[value];
      const label = isMarriedJoint ? L.joint || L.single : L.single || L.joint;
      return { value, label };
    })
    .filter(o => o.label.length > 0);
}
