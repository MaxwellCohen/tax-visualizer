import type { FilingStatus } from "~/lib/taxData";
import type { IncomeKind } from "~/lib/taxCalc";

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

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function labelForIncomeKind(kind: IncomeKind): string {
  return incomeKindOptions.find(o => o.value === kind)?.label ?? kind;
}
