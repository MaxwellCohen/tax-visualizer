import type { SubcategoryConfig } from "../types";

/**
 * Subcategories on the main 401(k)/403(b)/457(b) elective row (excludes the age-50+ catch-up row).
 * Single source for {@link makePretaxInputsConfig} and {@link electiveDeferrals401kFamilyExcludingCatchUp}.
 */
export const ELECTIVE_DEFERRAL_BASE_SUBCATEGORIES: readonly SubcategoryConfig[] = [
    { key: "input-pretax-401K-preTax401kSpouse1", labelSingle: "401(k) deferrals", labelJoint: "401(k) deferrals (spouse 1)" },
    { key: "input-pretax-401K-preTax403bSpouse1", labelSingle: "403(b) deferrals", labelJoint: "403(b) deferrals (spouse 1)" },
    { key: "input-pretax-401K-preTax457bSpouse1", labelSingle: "457(b) deferrals", labelJoint: "457(b) deferrals (spouse 1)" },
    { key: "input-pretax-401K-preTax401kSpouse2", labelSingle: "401(k) deferrals (2)", labelJoint: "401(k) deferrals (spouse 2)" },
    { key: "input-pretax-401K-preTax403bSpouse2", labelSingle: "403(b) deferrals (2)", labelJoint: "403(b) deferrals (spouse 2)" },
    { key: "input-pretax-401K-preTax457bSpouse2", labelSingle: "457(b) deferrals (2)", labelJoint: "457(b) deferrals (spouse 2)" },
];
