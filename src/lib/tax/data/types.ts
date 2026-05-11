
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
  /** Schedule SE: net earnings from self-employment as a fraction of gross SE income (e.g. 0.9235). */
  selfEmploymentNetEarningsFactor: number;
  /** Schedule SE Social Security portion on net SE earnings (e.g. 0.124). */
  selfEmploymentSocialSecurityRate: number;
  /** Schedule SE Medicare portion on net SE earnings (base 2.9%; excludes additional Medicare). */
  selfEmploymentMedicareRate: number;
};

/** LTCG tax bands by filing status. IRS-style stacking on ordinary taxable income. */
export type LongTermCapGainsThresholds = Array<{
  filingStatus: FilingStatus;
  brackets: FederalTaxBracket[];
}>;

/** Form 8960-style NIIT (§1411): 3.8% on lesser of NII and MAGI over threshold. Thresholds are not inflation-indexed. */
export type NiitRules = {
  rate: number;
  magiThreshold: FilingStatusRecord<number>;
};

/**
 * IRS-style contribution caps for the given `taxYear` (see `getTaxYearConfig(year).pretaxLimits`).
 * All amounts are per calendar/tax year and update when the selected year changes.
 */
export type PretaxBenefitLimits = {
  /** 401(k)/403(b)/457(b) elective deferral limit per employee. */
  electiveDeferral401k: number;
  /** Additional §402(g) elective deferral for age 50+ (combined with 401(k)/403(b) in the model). */
  electiveDeferral401kCatchUp: number;
  hsaSelfOnly: number;
  hsaFamily: number;
  /** Traditional (and Roth) IRA contribution limit per person (age-50+ IRA catch-up not modeled separately). */
  traditionalIraContribution: number;
};

/**
 * Schedule A dollar caps that can change with legislation (see `getTaxYearConfig(year).itemizedCaps`).
 * Only SALT is enforced in this app’s itemized model.
 */
export type ItemizedDeductionCaps = {
  /** Maximum combined state and local tax deduction (federal Schedule A). */
  saltMax: FilingStatusRecord<number>;
};

/**
 * Modeled ceiling on total entered amount per credit kind (sum across all rows of that kind).
 * IRS phase-outs and eligibility are not applied; entries are clamped before the nonrefundable tax cap.
 */
export type FederalTaxCreditCaps = Record<string, number>;

export type TaxYearConfig = {
  standardDeduction: FilingStatusRecord<number>;
  federalBrackets: FilingStatusRecord<FederalTaxBracket[]>;
  longTermCapGains: LongTermCapGainsThresholds;
  payroll: PayrollRules;
  pretaxLimits: PretaxBenefitLimits;
  itemizedCaps: ItemizedDeductionCaps;
  federalTaxCreditCaps: Record<string, number>;
  federalTaxCreditDefaults: Record<string, number>;
  /** Form 8960-style NIIT rate and MAGI thresholds (from year config / `YearValues`). */
  niit: NiitRules;
  status?: "final" | "planning";
};



