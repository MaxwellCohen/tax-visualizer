import type { YearValues } from "../types";
import type { FilingStatus } from "~/lib/taxData.types";

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

export const YEAR_VALUES_2023: YearValues = {
  year: 2023,
  standardDeduction: { single: 13850, marriedJoint: 27700, marriedSeparate: 13850, headOfHousehold: 20800 },
  brackets: buildBrackets([11000, 44725, 95375, 182100, 231250, 578125], [22000, 89450, 190750, 364200, 462500, 693750], [11000, 44725, 95375, 182100, 231250, 346875], [15700, 59850, 95350, 182100, 231250, 578100]),
  ltcgThresholds: { single: { zeroRateMax: 44625, fifteenRateMax: 492300 }, marriedJoint: { zeroRateMax: 89250, fifteenRateMax: 553850 }, marriedSeparate: { zeroRateMax: 44625, fifteenRateMax: 276900 }, headOfHousehold: { zeroRateMax: 59750, fifteenRateMax: 523050 } },
  limits: { electiveDeferral401k: 22500, hsaSelfOnly: 3850, hsaFamily: 7750, traditionalIra: 6500 },
  caps: {
    salt: { single: 10000, marriedJoint: 10000, marriedSeparate: 5000, headOfHousehold: 10000 },
    credits: { childTaxCredit: 40000, creditForOtherDependents: 10000, childAndDependentCare: 8000, educationCredits: 10000, retirementSavingsContributions: 2000, foreignTaxCredit: 9000000000, residentialCleanEnergy: 100000, electricVehicleCredit: 40000, generalBusinessCredit: 1000000, otherFederalCredit: 2000000 },
  },
  defaults: {
    credits: { childTaxCredit: 2000, creditForOtherDependents: 500, childAndDependentCare: 1500, educationCredits: 2000, retirementSavingsContributions: 1000, electricVehicleCredit: 7500 },
  },
  payroll: { ssRate: 0.062, ssWageBase: 160200, medicareRate: 0.0145, additionalMedicareRate: 0.009, additionalMedicareThreshold: THRESHOLDS_200K_250K_125K_200K },
  niitRate: 0.038,
  niitThreshold: THRESHOLDS_200K_250K_125K_200K,
};