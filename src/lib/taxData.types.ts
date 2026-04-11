export type FilingStatus = "single" | "marriedJoint" | "marriedSeparate" | "headOfHousehold";

export type FederalTaxBracket = {
  upTo: number | null;
  rate: number;
};

export type FilingStatusRecord<T> = Record<FilingStatus, T>;

type PayrollRules = {
  socialSecurityRate: number;
  socialSecurityWageBase: number;
  medicareRate: number;
  additionalMedicareRate: number;
  additionalMedicareThreshold: FilingStatusRecord<number>;
};

/** Top of 0% and 15% LTCG bands (taxable income); above fifteenRateMax is 20%. IRS-style stacking on ordinary taxable income. */
export type LongTermCapGainsThresholds = FilingStatusRecord<{
  zeroRateMax: number;
  fifteenRateMax: number;
}>;

/** Form 8960-style NIIT (§1411): 3.8% on lesser of NII and MAGI over threshold. Thresholds are not inflation-indexed. */
export type NiitRules = {
  rate: number;
  magiThreshold: FilingStatusRecord<number>;
};

/**
 * IRS-style contribution caps for the given `taxYear` (see `TAX_DATA_BY_YEAR[year].pretaxLimits`).
 * All amounts are per calendar/tax year and update when the selected year changes.
 */
export type PretaxBenefitLimits = {
  /** 401(k)/403(b)/457(b) elective deferral limit per employee. */
  electiveDeferral401k: number;
  hsaSelfOnly: number;
  hsaFamily: number;
  /** Traditional (and Roth) IRA contribution limit per person under age 50; catch-up omitted. */
  traditionalIraContribution: number;
};

export type TaxYearConfig = {
  standardDeduction: FilingStatusRecord<number>;
  federalBrackets: FilingStatusRecord<FederalTaxBracket[]>;
  longTermCapGains: LongTermCapGainsThresholds;
  payroll: PayrollRules;
  pretaxLimits: PretaxBenefitLimits;
  status?: "final" | "planning";
};
