export const STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
  "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export type StateCode = (typeof STATE_CODES)[number];

/** `[over, rate]`: `rate` applies to state taxable income above `over`. Income below the first `over` is untaxed. */
export type StateBracketRow = readonly [over: number, rate: number];

/** Amount pair for `[single, marriedJoint]`. Separate and head-of-household filers use the single amount. */
export type StateAmountPair = readonly [single: number, joint: number];

/**
 * One state's income tax rules for a year. Phaseouts and state credits beyond flat
 * exemption credits are intentionally not modeled.
 */
export type StateYearEntry = {
  /** One schedule for all filers, or separate single / married-joint schedules. */
  brackets: readonly StateBracketRow[] | { single: readonly StateBracketRow[]; joint: readonly StateBracketRow[] };
  /** `"federal"` = the state conforms to the federal standard deduction for the filing status. */
  standardDeduction?: StateAmountPair | "federal";
  /** Deduction per filer (single) or per couple (joint). */
  personalExemption?: StateAmountPair;
  /** Deduction per dependent. */
  dependentExemption?: number;
  /** Exemption taken as a nonrefundable credit instead of a deduction. */
  personalExemptionCredit?: StateAmountPair;
  dependentExemptionCredit?: number;
  /** Nonrefundable credit equal to this share of the federal standard or itemized deduction (Utah). */
  federalDeductionCreditRate?: number;
  /** Federal income tax paid is deductible up to this cap. */
  federalIncomeTaxDeductionCap?: StateAmountPair | "unlimited";
};

/** `null` = no broad-based individual income tax (wage income is untaxed). */
export type StateYearValues = Record<StateCode, StateYearEntry | null>;
