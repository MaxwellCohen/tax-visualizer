import { getStateYearValues } from "~/lib/config/states/index";
import type { StateAmountPair, StateBracketRow, StateYearEntry } from "~/lib/config/states/types";
import type { FilingStatus } from "~/lib/tax/data/types";
import type { ResidenceState } from "~/lib/tax/form/types";

export type StateIncomeTaxResult = {
  residenceState: ResidenceState;
  /** False when the year has no state data. A `null` (no income tax) state still counts as modeled. */
  modeled: boolean;
  /** Federal AGI used as the state starting point. */
  startingIncome: number;
  standardDeduction: number;
  exemptions: number;
  federalIncomeTaxDeduction: number;
  taxableIncome: number;
  taxBeforeCredits: number;
  /** Exemption-style credits applied (capped at tax; nonrefundable). */
  creditsApplied: number;
  tax: number;
  marginalRate: number;
};

function pick(pair: StateAmountPair | undefined, filingStatus: FilingStatus): number {
  if (!pair) return 0;
  return filingStatus === "marriedJoint" ? pair[1] : pair[0];
}

export function scheduleFor(entry: StateYearEntry, filingStatus: FilingStatus): readonly StateBracketRow[] {
  if (!("single" in entry.brackets)) return entry.brackets;
  return filingStatus === "marriedJoint" ? entry.brackets.joint : entry.brackets.single;
}

function taxFromSchedule(schedule: readonly StateBracketRow[], taxableIncome: number): { tax: number; marginalRate: number } {
  let tax = 0;
  let marginalRate = 0;
  for (let i = 0; i < schedule.length; i++) {
    const [over, rate] = schedule[i];
    if (taxableIncome <= over) break;
    const nextOver = schedule[i + 1]?.[0] ?? Number.POSITIVE_INFINITY;
    tax += (Math.min(taxableIncome, nextOver) - over) * rate;
    marginalRate = rate;
  }
  return { tax, marginalRate };
}

function emptyResult(residenceState: ResidenceState, modeled: boolean, startingIncome: number): StateIncomeTaxResult {
  return {
    residenceState,
    modeled,
    startingIncome,
    standardDeduction: 0,
    exemptions: 0,
    federalIncomeTaxDeduction: 0,
    taxableIncome: 0,
    taxBeforeCredits: 0,
    creditsApplied: 0,
    tax: 0,
    marginalRate: 0,
  };
}

/**
 * State income tax on federal AGI: state standard deduction and flat exemptions, the state's
 * bracket schedule, then flat exemption credits. No phaseouts, other state credits, or local taxes.
 */
export function calculateStateIncomeTax(args: {
  residenceState: ResidenceState;
  taxYear: number;
  filingStatus: FilingStatus;
  federalAgi: number;
  dependents: number;
  federalStandardDeduction: number;
  /** Federal standard or itemized deduction actually claimed (Utah's credit base). */
  federalDeductionClaimed: number;
  federalIncomeTax: number;
}): StateIncomeTaxResult {
  const startingIncome = Math.max(0, args.federalAgi);
  if (args.residenceState === "none") return emptyResult("none", true, startingIncome);
  const yearValues = getStateYearValues(args.taxYear);
  if (!yearValues) return emptyResult(args.residenceState, false, startingIncome);
  const entry = yearValues[args.residenceState];
  if (!entry) return emptyResult(args.residenceState, true, startingIncome);

  const { filingStatus } = args;
  const dependents = Math.max(0, args.dependents);
  const standardDeduction =
    entry.standardDeduction === "federal"
      ? args.federalStandardDeduction
      : pick(entry.standardDeduction, filingStatus);
  const exemptions = pick(entry.personalExemption, filingStatus) + dependents * (entry.dependentExemption ?? 0);
  const federalIncomeTax = Math.max(0, args.federalIncomeTax);
  const federalIncomeTaxDeduction =
    entry.federalIncomeTaxDeductionCap === "unlimited"
      ? federalIncomeTax
      : Math.min(federalIncomeTax, pick(entry.federalIncomeTaxDeductionCap, filingStatus));
  const taxableIncome = Math.max(0, startingIncome - standardDeduction - exemptions - federalIncomeTaxDeduction);
  const { tax: taxBeforeCredits, marginalRate } = taxFromSchedule(scheduleFor(entry, filingStatus), taxableIncome);
  const credits =
    pick(entry.personalExemptionCredit, filingStatus) +
    dependents * (entry.dependentExemptionCredit ?? 0) +
    (entry.federalDeductionCreditRate ?? 0) * Math.max(0, args.federalDeductionClaimed);
  const creditsApplied = Math.min(credits, taxBeforeCredits);

  return {
    residenceState: args.residenceState,
    modeled: true,
    startingIncome,
    standardDeduction,
    exemptions,
    federalIncomeTaxDeduction,
    taxableIncome,
    taxBeforeCredits,
    creditsApplied,
    tax: taxBeforeCredits - creditsApplied,
    marginalRate,
  };
}
