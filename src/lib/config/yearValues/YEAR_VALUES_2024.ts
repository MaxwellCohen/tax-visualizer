// fallow-ignore-file code-duplication
import type { YearValues } from "../types";
import { buildBrackets, buildLtcgBrackets, THRESHOLDS_200K_250K_125K_200K } from "./shared";

export const YEAR_VALUES_2024: YearValues = {
  year: 2024,
  standardDeduction: { single: 14600, marriedJoint: 29200, marriedSeparate: 14600, headOfHousehold: 21900 },
  brackets: buildBrackets([11600, 47150, 100525, 191950, 243725, 609350], [23200, 94300, 201050, 383900, 487450, 731200], [11600, 47150, 100525, 191950, 243725, 365600], [16550, 63100, 100500, 191950, 243700, 609350]),
  ltcgThresholds: buildLtcgBrackets([47025, 518900], [94050, 583750], [47025, 291850], [63000, 566700]),
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