import type { YearValues, FilingStatus } from "../types";

function buildBrackets(
  single: number[],
  marriedJoint: number[],
  marriedSeparate: number[],
  headOfHousehold: number[]
): Record<FilingStatus, { upTo: number | null; rate: number }[]> {
  return {
    single: single.map((upTo, i) => ({ upTo, rate: [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37][i] })).concat([{ upTo: null as unknown as number, rate: 0.37 }]),
    marriedJoint: marriedJoint.map((upTo, i) => ({ upTo, rate: [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37][i] })).concat([{ upTo: null as unknown as number, rate: 0.37 }]),
    marriedSeparate: marriedSeparate.map((upTo, i) => ({ upTo, rate: [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37][i] })).concat([{ upTo: null as unknown as number, rate: 0.37 }]),
    headOfHousehold: headOfHousehold.map((upTo, i) => ({ upTo, rate: [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37][i] })).concat([{ upTo: null as unknown as number, rate: 0.37 }]),
  };
}

const THRESHOLDS_200K_250K_125K_200K: Record<FilingStatus, number> = {
  single: 200000,
  marriedJoint: 250000,
  marriedSeparate: 125000,
  headOfHousehold: 200000,
};

export const YEAR_VALUES_2025: YearValues = {
  year: 2025,
  standardDeduction: { single: 15750, marriedJoint: 31500, marriedSeparate: 15750, headOfHousehold: 23625 },
  brackets: buildBrackets([11925, 48475, 103350, 197300, 250525, 626350], [23850, 96950, 206700, 394600, 501050, 751600], [11925, 48475, 103350, 197300, 250525, 375800], [17000, 64850, 103350, 197300, 250500, 626350]),
  ltcgThresholds: { single: { zeroRateMax: 48350, fifteenRateMax: 533400 }, marriedJoint: { zeroRateMax: 96700, fifteenRateMax: 600050 }, marriedSeparate: { zeroRateMax: 48350, fifteenRateMax: 300000 }, headOfHousehold: { zeroRateMax: 64750, fifteenRateMax: 566700 } },
  limits: { electiveDeferral401k: 23500, hsaSelfOnly: 4300, hsaFamily: 8550, traditionalIra: 7000 },
  caps: {
    salt: { single: 10000, marriedJoint: 10000, marriedSeparate: 5000, headOfHousehold: 10000 },
    credits: { childTaxCredit: 40000, creditForOtherDependents: 10000, childAndDependentCare: 8000, educationCredits: 10000, retirementSavingsContributions: 2000, foreignTaxCredit: 9000000000, residentialCleanEnergy: 100000, electricVehicleCredit: 40000, generalBusinessCredit: 1000000, otherFederalCredit: 2000000 },
  },
  defaults: {
    credits: { childTaxCredit: 2200, creditForOtherDependents: 500, childAndDependentCare: 1500, educationCredits: 2000, retirementSavingsContributions: 1000, electricVehicleCredit: 7500 },
  },
  payroll: { ssRate: 0.062, ssWageBase: 176100, medicareRate: 0.0145, additionalMedicareRate: 0.009, additionalMedicareThreshold: THRESHOLDS_200K_250K_125K_200K },
  niitRate: 0.038,
  niitThreshold: THRESHOLDS_200K_250K_125K_200K,
};