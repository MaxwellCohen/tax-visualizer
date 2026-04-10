export type FilingStatus = "single" | "marriedJoint" | "marriedSeparate" | "headOfHousehold";

export type FederalTaxBracket = {
  upTo: number | null;
  rate: number;
};

export type FilingStatusRecord<T> = Record<FilingStatus, T>;

export type PayrollRules = {
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

export const FEDERAL_NIIT: NiitRules = {
  rate: 0.038,
  magiThreshold: {
    single: 200_000,
    marriedJoint: 250_000,
    marriedSeparate: 125_000,
    headOfHousehold: 200_000,
  },
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

function buildFederalBrackets(
  single: number[],
  marriedJoint: number[],
  marriedSeparate: number[],
  headOfHousehold: number[],
): FilingStatusRecord<FederalTaxBracket[]> {
  return {
    single: thresholdsToBrackets(single),
    marriedJoint: thresholdsToBrackets(marriedJoint),
    marriedSeparate: thresholdsToBrackets(marriedSeparate),
    headOfHousehold: thresholdsToBrackets(headOfHousehold),
  };
}

function thresholdsToBrackets(thresholds: number[]): FederalTaxBracket[] {
  return [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37].map((rate, index) => ({
    rate,
    upTo: thresholds[index] ?? null,
  }));
}

const FEDERAL_BRACKETS_2023 = buildFederalBrackets(
  [11_000, 44_725, 95_375, 182_100, 231_250, 578_125],
  [22_000, 89_450, 190_750, 364_200, 462_500, 693_750],
  [11_000, 44_725, 95_375, 182_100, 231_250, 346_875],
  [15_700, 59_850, 95_350, 182_100, 231_250, 578_100],
);

const FEDERAL_BRACKETS_2024 = buildFederalBrackets(
  [11_600, 47_150, 100_525, 191_950, 243_725, 609_350],
  [23_200, 94_300, 201_050, 383_900, 487_450, 731_200],
  [11_600, 47_150, 100_525, 191_950, 243_725, 365_600],
  [16_550, 63_100, 100_500, 191_950, 243_700, 609_350],
);

const FEDERAL_BRACKETS_2025 = buildFederalBrackets(
  [11_925, 48_475, 103_350, 197_300, 250_525, 626_350],
  [23_850, 96_950, 206_700, 394_600, 501_050, 751_600],
  [11_925, 48_475, 103_350, 197_300, 250_525, 375_800],
  [17_000, 64_850, 103_350, 197_300, 250_500, 626_350],
);

const FEDERAL_BRACKETS_2026 = buildFederalBrackets(
  [12_400, 50_400, 105_700, 201_775, 256_225, 640_600],
  [24_800, 100_800, 211_400, 403_550, 512_450, 768_700],
  [12_400, 50_400, 105_700, 201_775, 256_225, 384_350],
  [17_700, 67_450, 105_700, 201_775, 256_200, 640_600],
);

/** IRS inflation-adjusted LTCG breakpoints (Rev. Proc. / Topic 409 figures by tax year). */
const LTCG_2023: LongTermCapGainsThresholds = {
  single: { zeroRateMax: 44_625, fifteenRateMax: 492_300 },
  marriedJoint: { zeroRateMax: 89_250, fifteenRateMax: 553_850 },
  marriedSeparate: { zeroRateMax: 44_625, fifteenRateMax: 276_900 },
  headOfHousehold: { zeroRateMax: 59_750, fifteenRateMax: 523_050 },
};

const LTCG_2024: LongTermCapGainsThresholds = {
  single: { zeroRateMax: 47_025, fifteenRateMax: 518_900 },
  marriedJoint: { zeroRateMax: 94_050, fifteenRateMax: 583_750 },
  marriedSeparate: { zeroRateMax: 47_025, fifteenRateMax: 291_850 },
  headOfHousehold: { zeroRateMax: 63_000, fifteenRateMax: 566_700 },
};

const LTCG_2025: LongTermCapGainsThresholds = {
  single: { zeroRateMax: 48_350, fifteenRateMax: 533_400 },
  marriedJoint: { zeroRateMax: 96_700, fifteenRateMax: 600_050 },
  marriedSeparate: { zeroRateMax: 48_350, fifteenRateMax: 300_000 },
  headOfHousehold: { zeroRateMax: 64_750, fifteenRateMax: 566_700 },
};

/** Projected / Rev.Proc. 2025-XX style inflation figures for planning years. */
const LTCG_2026: LongTermCapGainsThresholds = {
  single: { zeroRateMax: 49_450, fifteenRateMax: 545_500 },
  marriedJoint: { zeroRateMax: 98_900, fifteenRateMax: 613_700 },
  marriedSeparate: { zeroRateMax: 49_450, fifteenRateMax: 306_850 },
  headOfHousehold: { zeroRateMax: 66_200, fifteenRateMax: 579_600 },
};

export const TAX_DATA_BY_YEAR: Record<number, TaxYearConfig> = {
  2023: {
    standardDeduction: {
      single: 13_850,
      marriedJoint: 27_700,
      marriedSeparate: 13_850,
      headOfHousehold: 20_800,
    },
    federalBrackets: FEDERAL_BRACKETS_2023,
    longTermCapGains: LTCG_2023,
    payroll: {
      socialSecurityRate: 0.062,
      socialSecurityWageBase: 160_200,
      medicareRate: 0.0145,
      additionalMedicareRate: 0.009,
      additionalMedicareThreshold: {
        single: 200_000,
        marriedJoint: 250_000,
        marriedSeparate: 125_000,
        headOfHousehold: 200_000,
      },
    },
    pretaxLimits: {
      electiveDeferral401k: 22_500,
      hsaSelfOnly: 3_850,
      hsaFamily: 7_750,
      traditionalIraContribution: 6_500,
    },
    status: "final",
  },
  2024: {
    standardDeduction: {
      single: 14_600,
      marriedJoint: 29_200,
      marriedSeparate: 14_600,
      headOfHousehold: 21_900,
    },
    federalBrackets: FEDERAL_BRACKETS_2024,
    longTermCapGains: LTCG_2024,
    payroll: {
      socialSecurityRate: 0.062,
      socialSecurityWageBase: 168_600,
      medicareRate: 0.0145,
      additionalMedicareRate: 0.009,
      additionalMedicareThreshold: {
        single: 200_000,
        marriedJoint: 250_000,
        marriedSeparate: 125_000,
        headOfHousehold: 200_000,
      },
    },
    pretaxLimits: {
      electiveDeferral401k: 23_000,
      hsaSelfOnly: 4_150,
      hsaFamily: 8_300,
      traditionalIraContribution: 7_000,
    },
    status: "final",
  },
  2025: {
    standardDeduction: {
      single: 15_750,
      marriedJoint: 31_500,
      marriedSeparate: 15_750,
      headOfHousehold: 23_625,
    },
    federalBrackets: FEDERAL_BRACKETS_2025,
    longTermCapGains: LTCG_2025,
    payroll: {
      socialSecurityRate: 0.062,
      socialSecurityWageBase: 176_100,
      medicareRate: 0.0145,
      additionalMedicareRate: 0.009,
      additionalMedicareThreshold: {
        single: 200_000,
        marriedJoint: 250_000,
        marriedSeparate: 125_000,
        headOfHousehold: 200_000,
      },
    },
    pretaxLimits: {
      electiveDeferral401k: 23_500,
      hsaSelfOnly: 4_300,
      hsaFamily: 8_550,
      traditionalIraContribution: 7_000,
    },
    status: "final",
  },
  2026: {
    standardDeduction: {
      single: 16_100,
      marriedJoint: 32_200,
      marriedSeparate: 16_100,
      headOfHousehold: 24_150,
    },
    federalBrackets: FEDERAL_BRACKETS_2026,
    longTermCapGains: LTCG_2026,
    payroll: {
      socialSecurityRate: 0.062,
      socialSecurityWageBase: 181_200,
      medicareRate: 0.0145,
      additionalMedicareRate: 0.009,
      additionalMedicareThreshold: {
        single: 200_000,
        marriedJoint: 250_000,
        marriedSeparate: 125_000,
        headOfHousehold: 200_000,
      },
    },
    pretaxLimits: {
      electiveDeferral401k: 24_000,
      hsaSelfOnly: 4_400,
      hsaFamily: 8_750,
      traditionalIraContribution: 7_150,
    },
    status: "planning",
  },
};

export function getAvailableTaxYears(): number[] {
  return Object.keys(TAX_DATA_BY_YEAR)
    .map(Number)
    .sort((a, b) => b - a);
}

export function getTaxYearConfig(taxYear: number): TaxYearConfig | null {
  return TAX_DATA_BY_YEAR[taxYear] ?? null;
}

export function isPlanningTaxYear(taxYear: number): boolean {
  return getTaxYearConfig(taxYear)?.status === "planning";
}

/** Contribution caps (401(k), HSA, IRA) for `taxYear`, or null if the year is not modeled. */
export function getPretaxLimits(taxYear: number): PretaxBenefitLimits | null {
  return getTaxYearConfig(taxYear)?.pretaxLimits ?? null;
}
