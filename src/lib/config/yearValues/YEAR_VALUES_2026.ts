import type { YearValues } from "../types";
import { buildBrackets, buildLtcgBrackets, THRESHOLDS_200K_250K_125K_200K } from "./shared";

export const YEAR_VALUES_2026: YearValues = {
  year: 2026,
  standardDeduction: { single: 16100, marriedJoint: 32200, marriedSeparate: 16100, headOfHousehold: 24150 },
  brackets: buildBrackets([12400, 50400, 105700, 201775, 256225, 640600], [24800, 100800, 211400, 403550, 512450, 768700], [12400, 50400, 105700, 201775, 256225, 384350], [17700, 67450, 105700, 201775, 256200, 640600]),
  ltcgThresholds: buildLtcgBrackets([49450, 545500], [98900, 613700], [49450, 306850], [66200, 579600]),
  limits: { electiveDeferral401k: 24000, hsaSelfOnly: 4400, hsaFamily: 8750, traditionalIra: 7150 },
  caps: {
    salt: { single: 40400, marriedJoint: 40400, marriedSeparate: 20200, headOfHousehold: 40400 },
    credits: { childTaxCredit: 40000, creditForOtherDependents: 10000, childAndDependentCare: 8000, educationCredits: 10000, retirementSavingsContributions: 2000, foreignTaxCredit: 9000000000, residentialCleanEnergy: 110000, electricVehicleCredit: 45000, generalBusinessCredit: 1000000, otherFederalCredit: 2000000 },
  },
  defaults: {
    credits: { childTaxCredit: 2200, creditForOtherDependents: 500, childAndDependentCare: 1500, educationCredits: 2000, retirementSavingsContributions: 1000, electricVehicleCredit: 7500 },
  },
  payroll: { ssRate: 0.062, ssWageBase: 181200, medicareRate: 0.0145, additionalMedicareRate: 0.009, additionalMedicareThreshold: THRESHOLDS_200K_250K_125K_200K, selfEmploymentNetEarningsFactor: 0.9235, selfEmploymentSocialSecurityRate: 0.124, selfEmploymentMedicareRate: 0.029 },
  niitRate: 0.038,
  niitThreshold: THRESHOLDS_200K_250K_125K_200K,
};