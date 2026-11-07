import type { YearValues } from "../types";
import { buildBrackets, buildLtcgBrackets, THRESHOLDS_200K_250K_125K_200K } from "./shared";

/** Source: IRS Rev. Proc. 2026-35 (brackets, std deduction, LTCG, CTC); HSA per Rev. Proc. 2026-24; SSA wage base. 401(k)/IRA limits are projections until the IRS notice. SALT cap = 2026 cap +1% (OBBBA). */
export const YEAR_VALUES_2027: YearValues = {
  year: 2027,
  standardDeduction: { single: 16600, marriedJoint: 33200, marriedSeparate: 16600, headOfHousehold: 24925 },
  brackets: buildBrackets([12800, 52025, 109125, 208325, 264550, 661375], [25600, 104050, 218250, 416650, 529100, 793650], [12800, 52025, 109125, 208325, 264550, 396825], [18250, 69650, 109100, 208300, 264550, 661350]),
  ltcgThresholds: buildLtcgBrackets([51050, 563200], [102100, 633600], [51050, 316800], [68350, 598400]),
  limits: {
    electiveDeferral401k: 25500,
    electiveDeferral401kCatchUp: 8500,
    hsaSelfOnly: 4500,
    hsaFamily: 9000,
    traditionalIra: 7500,
  },
  caps: {
    salt: { single: 40804, marriedJoint: 40804, marriedSeparate: 20402, headOfHousehold: 40804 },
    credits: { childTaxCredit: 40000, creditForOtherDependents: 10000, childAndDependentCare: 8000, educationCredits: 10000, retirementSavingsContributions: 2000, foreignTaxCredit: 9000000000, residentialCleanEnergy: 110000, electricVehicleCredit: 45000, generalBusinessCredit: 1000000, otherFederalCredit: 2000000 },
  },
  defaults: {
    credits: { childTaxCredit: 2300, creditForOtherDependents: 500, childAndDependentCare: 1500, educationCredits: 2000, retirementSavingsContributions: 1000, electricVehicleCredit: 7500 },
  },
  payroll: { ssRate: 0.062, ssWageBase: 192300, medicareRate: 0.0145, additionalMedicareRate: 0.009, additionalMedicareThreshold: THRESHOLDS_200K_250K_125K_200K, selfEmploymentNetEarningsFactor: 0.9235, selfEmploymentSocialSecurityRate: 0.124, selfEmploymentMedicareRate: 0.029 },
  niitRate: 0.038,
  niitThreshold: THRESHOLDS_200K_250K_125K_200K,
};