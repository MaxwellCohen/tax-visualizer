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

export const YEAR_VALUES_2024: YearValues = {
  year: 2024,
  standardDeduction: { single: 14600, marriedJoint: 29200, marriedSeparate: 14600, headOfHousehold: 21900 },
  brackets: buildBrackets([11600, 47150, 100525, 191950, 243725, 609350], [23200, 94300, 201050, 383900, 487450, 731200], [11600, 47150, 100525, 191950, 243725, 365600], [16550, 63100, 100500, 191950, 243700, 609350]),
  ltcgThresholds: { single: { zeroRateMax: 47025, fifteenRateMax: 518900 }, marriedJoint: { zeroRateMax: 94050, fifteenRateMax: 583750 }, marriedSeparate: { zeroRateMax: 47025, fifteenRateMax: 291850 }, headOfHousehold: { zeroRateMax: 63000, fifteenRateMax: 566700 } },
  limits: { electiveDeferral401k: 23000, hsaSelfOnly: 4150, hsaFamily: 8300, traditionalIra: 7000 },
  caps: {
    salt: { single: 10000, marriedJoint: 10000, marriedSeparate: 5000, headOfHousehold: 10000 },
    credits: { childTaxCredit: 40000, creditForOtherDependents: 10000, childAndDependentCare: 8000, educationCredits: 10000, retirementSavingsContributions: 2000, foreignTaxCredit: 9000000000, residentialCleanEnergy: 100000, electricVehicleCredit: 40000, generalBusinessCredit: 1000000, otherFederalCredit: 2000000 },
  },
  defaults: {
    credits: { childTaxCredit: 2000, creditForOtherDependents: 500, childAndDependentCare: 1500, educationCredits: 2000, retirementSavingsContributions: 1000, electricVehicleCredit: 7500 },
  },
  payroll: { ssRate: 0.062, ssWageBase: 168600, medicareRate: 0.0145, additionalMedicareRate: 0.009, additionalMedicareThreshold: THRESHOLDS_200K_250K_125K_200K, selfEmploymentNetEarningsFactor: 0.9235, selfEmploymentSocialSecurityRate: 0.124, selfEmploymentMedicareRate: 0.029 },
  niitRate: 0.038,
  niitThreshold: THRESHOLDS_200K_250K_125K_200K,
};