import type { FilingStatus } from "~/lib/taxData";
import type { FederalTaxCreditKind, IncomeKind, ItemizedDeductionKind, PretaxBenefitKind } from "~/lib/taxCalc";
import { INCOME_KINDS_CONFIG, incomeKindLabel } from "~/lib/taxData.incomeKinds.config";
import { isPretaxSpouse2Kind } from "~/lib/taxCalc.pretaxBenefitSource";

export const filingStatusOptions: Array<{ value: FilingStatus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married filing jointly" },
  { value: "marriedSeparate", label: "Married filing separately" },
  { value: "headOfHousehold", label: "Head of household" },
];

export const incomeKindOptions: Array<{ value: IncomeKind; label: string }> = INCOME_KINDS_CONFIG.map(
  (c) => ({ value: c.kind, label: c.label })
);

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
  return incomeKindLabel(kind);
}

const pretaxBenefitLabels: Record<
  PretaxBenefitKind,
  { single: string; joint: string }
> = {
  preTax401kSpouse1: {
    single: "401(k) deferrals",
    joint: "401(k) deferrals — Spouse 1",
  },
  preTax403bSpouse1: {
    single: "403(b) deferrals",
    joint: "403(b) deferrals — Spouse 1",
  },
  preTax457bSpouse1: {
    single: "457(b) deferrals (limits differ for some plans)",
    joint: "457(b) deferrals — Spouse 1 (limits differ for some plans)",
  },
  preTax401kSpouse2: {
    single: "",
    joint: "401(k) deferrals — Spouse 2",
  },
  preTax403bSpouse2: {
    single: "",
    joint: "403(b) deferrals — Spouse 2",
  },
  preTax457bSpouse2: {
    single: "",
    joint: "457(b) deferrals — Spouse 2 (limits differ for some plans)",
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
    single: "Other payroll pre-tax (catch-all)",
    joint: "Other payroll pre-tax (catch-all)",
  },
  preTaxHealthFsaSpouse1: {
    single: "Health FSA (payroll)",
    joint: "Health FSA — Spouse 1",
  },
  preTaxHealthFsaSpouse2: {
    single: "",
    joint: "Health FSA — Spouse 2",
  },
  preTaxDependentCareFsaSpouse1: {
    single: "Dependent care FSA (payroll)",
    joint: "Dependent care FSA — Spouse 1",
  },
  preTaxDependentCareFsaSpouse2: {
    single: "",
    joint: "Dependent care FSA — Spouse 2",
  },
  preTaxCommuterSpouse1: {
    single: "Commuter / parking (payroll)",
    joint: "Commuter / parking — Spouse 1",
  },
  preTaxCommuterSpouse2: {
    single: "",
    joint: "Commuter / parking — Spouse 2",
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

const itemizedDeductionKindLabels: Record<ItemizedDeductionKind, string> = {
  medicalDental: "Medical & dental",
  salt: "State & local taxes (SALT)",
  mortgageInterest: "Home mortgage interest",
  investmentInterest: "Investment interest",
  charitable: "Charitable contributions",
  casualtyTheft: "Casualty & theft losses",
  otherItemized: "Other itemized",
};

export function itemizedDeductionKindSelectOptions(): Array<{
  value: ItemizedDeductionKind;
  label: string;
}> {
  return (Object.keys(itemizedDeductionKindLabels) as ItemizedDeductionKind[]).map(value => ({
    value,
    label: itemizedDeductionKindLabels[value],
  }));
}

const federalTaxCreditKindLabels: Record<FederalTaxCreditKind, string> = {
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

export function federalTaxCreditKindSelectOptions(): Array<{
  value: FederalTaxCreditKind;
  label: string;
}> {
  return (Object.keys(federalTaxCreditKindLabels) as FederalTaxCreditKind[]).map(value => ({
    value,
    label: federalTaxCreditKindLabels[value],
  }));
}
