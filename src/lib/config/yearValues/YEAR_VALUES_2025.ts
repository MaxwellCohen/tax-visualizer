import type { YearValues } from "../types";
import { buildBrackets, buildLtcgBrackets, THRESHOLDS_200K_250K_125K_200K } from "./shared";

export const YEAR_VALUES_2025: YearValues = {
  year: 2025,
  standardDeduction: { single: 15750, marriedJoint: 31500, marriedSeparate: 15750, headOfHousehold: 23625 },
  brackets: buildBrackets([11925, 48475, 103350, 197300, 250525, 626350], [23850, 96950, 206700, 394600, 501050, 751600], [11925, 48475, 103350, 197300, 250525, 375800], [17000, 64850, 103350, 197300, 250500, 626350]),
  ltcgThresholds: buildLtcgBrackets([48350, 533400], [96700, 600050], [48350, 300000], [64750, 566700]),
  limits: { electiveDeferral401k: 23500, hsaSelfOnly: 4300, hsaFamily: 8550, traditionalIra: 7000 },
  caps: {
    salt: { single: 40000, marriedJoint: 40000, marriedSeparate: 20000, headOfHousehold: 40000 },
    credits: { childTaxCredit: 40000, creditForOtherDependents: 10000, childAndDependentCare: 8000, educationCredits: 10000, retirementSavingsContributions: 2000, foreignTaxCredit: 9000000000, residentialCleanEnergy: 100000, electricVehicleCredit: 40000, generalBusinessCredit: 1000000, otherFederalCredit: 2000000 },
  },
  defaults: {
    credits: { childTaxCredit: 2200, creditForOtherDependents: 500, childAndDependentCare: 1500, educationCredits: 2000, retirementSavingsContributions: 1000, electricVehicleCredit: 7500 },
  },
  payroll: { ssRate: 0.062, ssWageBase: 176100, medicareRate: 0.0145, additionalMedicareRate: 0.009, additionalMedicareThreshold: THRESHOLDS_200K_250K_125K_200K, selfEmploymentNetEarningsFactor: 0.9235, selfEmploymentSocialSecurityRate: 0.124, selfEmploymentMedicareRate: 0.029 },
  niitRate: 0.038,
  niitThreshold: THRESHOLDS_200K_250K_125K_200K,
};