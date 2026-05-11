// fallow-ignore-file code-duplication
import type { YearValues } from "../types";
import { buildBrackets, buildLtcgBrackets, THRESHOLDS_200K_250K_125K_200K } from "./shared";

export const YEAR_VALUES_2023: YearValues = {
  year: 2023,
  standardDeduction: { single: 13850, marriedJoint: 27700, marriedSeparate: 13850, headOfHousehold: 20800 },
  brackets: buildBrackets([11000, 44725, 95375, 182100, 231250, 578125], [22000, 89450, 190750, 364200, 462500, 693750], [11000, 44725, 95375, 182100, 231250, 346875], [15700, 59850, 95350, 182100, 231250, 578100]),
  ltcgThresholds: buildLtcgBrackets([44625, 492300], [89250, 553850], [44625, 276900], [59750, 523050]),
  limits: {
    electiveDeferral401k: 22500,
    electiveDeferral401kCatchUp: 7500,
    hsaSelfOnly: 3850,
    hsaFamily: 7750,
    traditionalIra: 6500,
  },
  caps: {
    salt: { single: 10000, marriedJoint: 10000, marriedSeparate: 5000, headOfHousehold: 10000 },
    credits: { childTaxCredit: 40000, creditForOtherDependents: 10000, childAndDependentCare: 8000, educationCredits: 10000, retirementSavingsContributions: 2000, foreignTaxCredit: 9000000000, residentialCleanEnergy: 100000, electricVehicleCredit: 40000, generalBusinessCredit: 1000000, otherFederalCredit: 2000000 },
  },
  defaults: {
    credits: { childTaxCredit: 2000, creditForOtherDependents: 500, childAndDependentCare: 1500, educationCredits: 2000, retirementSavingsContributions: 1000, electricVehicleCredit: 7500 },
  },
  payroll: { ssRate: 0.062, ssWageBase: 160200, medicareRate: 0.0145, additionalMedicareRate: 0.009, additionalMedicareThreshold: THRESHOLDS_200K_250K_125K_200K, selfEmploymentNetEarningsFactor: 0.9235, selfEmploymentSocialSecurityRate: 0.124, selfEmploymentMedicareRate: 0.029 },
  niitRate: 0.038,
  niitThreshold: THRESHOLDS_200K_250K_125K_200K,
};