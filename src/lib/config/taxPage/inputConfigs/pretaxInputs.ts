/** Pre-tax inputs: 401(k), HSA, traditional IRA, other payroll pre-tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { _401k, _hsa, otherPretax, traditionalIra } from "../rowMetrics";
import {
    nonNegativeValidator,
    makeYearValuesCappedValidator,
    makeElectiveDeferral401kFamilyRowValidator,
    makeHsaCappedValidator,
} from "../inputValidators";

export function makePretaxInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "input-pretax-401K",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "401(k) Deferrals", compact: "401(k)" },
            description:
                "Elective deferrals from W-2 pay — 401(k), 403(b), and 457(b) elective deferrals share the same IRS limit per employee",
            kindDetail: {
                limitNote:
                    "401(k), 403(b), and age-50+ elective catch-up share the §402(g) deferral limit per employee; 457(b) is separate in IRS rules and uses the base deferral cap per row here",
            },
            input: {
                category: "pretax",
                displayOrder: 1,
                inputType: "currency",
                subcategories: [
                    { key: "input-pretax-401K-preTax401kSpouse1", labelSingle: "401(k) deferrals", labelJoint: "401(k) deferrals (spouse 1)" },
                    { key: "input-pretax-401K-preTax403bSpouse1", labelSingle: "403(b) deferrals", labelJoint: "403(b) deferrals (spouse 1)" },
                    { key: "input-pretax-401K-preTax457bSpouse1", labelSingle: "457(b) deferrals", labelJoint: "457(b) deferrals (spouse 1)" },
                    { key: "input-pretax-401K-electiveCatchUpSpouse1", labelSingle: "Age 50+ catch-up (401(k)/403(b))", labelJoint: "Age 50+ catch-up (401(k)/403(b)) (spouse 1)" },
                    { key: "input-pretax-401K-preTax401kSpouse2", labelSingle: "401(k) deferrals (2)", labelJoint: "401(k) deferrals (spouse 2)" },
                    { key: "input-pretax-401K-preTax403bSpouse2", labelSingle: "403(b) deferrals (2)", labelJoint: "403(b) deferrals (spouse 2)" },
                    { key: "input-pretax-401K-preTax457bSpouse2", labelSingle: "457(b) deferrals (2)", labelJoint: "457(b) deferrals (spouse 2)" },
                    { key: "input-pretax-401K-electiveCatchUpSpouse2", labelSingle: "Age 50+ catch-up (401(k)/403(b)) (2)", labelJoint: "Age 50+ catch-up (401(k)/403(b)) (spouse 2)" },
                ],
                getLimit: (yearValues) =>
                    (yearValues.limits.electiveDeferral401k ?? 23000) +
                    (yearValues.limits.electiveDeferral401kCatchUp ?? 7500),
                validate: makeElectiveDeferral401kFamilyRowValidator(23000, 7500),
            },
            calculate: _401k, 
            sankey: {
                node: { row: 1, col: 2 },
                links: [
                    { source: "wages", target: "pretaxDeductions", row: 1, col: 1 },
                ],
            },
        },
        {
            id: "input-pretax-hsa",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "HSA (payroll)", compact: "HSA" },
            description: "Payroll HSA contributions",
            kindDetail: {
                limitNote: "payroll HSA contributions toward HDHP limits",
            },
            input: {
                category: "pretax",
                displayOrder: 2,
                inputType: "currency",
                subcategories: [
                    { key: "input-pretax-hsa-preTaxHsaSpouse1", labelSingle: "HSA (payroll)", labelJoint: "HSA (payroll) (spouse 1)" },
                    { key: "input-pretax-hsa-preTaxHsaSpouse2", labelSingle: "HSA (payroll) (2)", labelJoint: "HSA (payroll) (spouse 2)" },
                ],
                getFilingStatusLimit: (yearValues, filingStatus) => {
                    const isJoint = filingStatus === "marriedJoint";
                    return isJoint ? (yearValues.limits.hsaFamily ?? 8550) : (yearValues.limits.hsaSelfOnly ?? 4300);
                },
                validate: makeHsaCappedValidator,
                showWhen: (ctx) => ctx.isJoint !== undefined,
            },
            calculate: _hsa,
            sankey: {
                node: { row: 2, col: 3 },
                links: [
                    { source: "wages", target: "pretaxDeductions", row: 1, col: 1 },
                ],
            },
        },
        {
            id: "input-pretax-otherPretax",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "Other Pre-tax (payroll)", compact: "Other Pre-tax" },
            description: "Miscellaneous payroll amounts taken pre-tax",
            kindDetail: {
                limitNote: "miscellaneous payroll amounts taken pre-tax",
            },
            input: {
                category: "pretax",
                displayOrder: 3,
                inputType: "currency",
                subcategories: [
                    { key: "input-pretax-otherPretax-preTaxOther", labelSingle: "Other payroll pre-tax", labelJoint: "Other payroll pre-tax" },
                    { key: "input-pretax-otherPretax-preTaxHealthFsaSpouse1", labelSingle: "Health FSA (payroll)", labelJoint: "Health FSA (payroll) (spouse 1)" },
                    { key: "input-pretax-otherPretax-preTaxHealthFsaSpouse2", labelSingle: "Health FSA (payroll) (2)", labelJoint: "Health FSA (payroll) (spouse 2)" },
                    { key: "input-pretax-otherPretax-preTaxDependentCareFsaSpouse1", labelSingle: "Dependent care FSA (payroll)", labelJoint: "Dependent care FSA (payroll) (spouse 1)" },
                    { key: "input-pretax-otherPretax-preTaxDependentCareFsaSpouse2", labelSingle: "Dependent care FSA (payroll) (2)", labelJoint: "Dependent care FSA (payroll) (spouse 2)" },
                    { key: "input-pretax-otherPretax-preTaxCommuterSpouse1", labelSingle: "Commuter / parking (payroll)", labelJoint: "Commuter / parking (payroll) (spouse 1)" },
                    { key: "input-pretax-otherPretax-preTaxCommuterSpouse2", labelSingle: "Commuter / parking (payroll) (2)", labelJoint: "Commuter / parking (payroll) (spouse 2)" },
                ],
                validate: nonNegativeValidator,
            },
            calculate: otherPretax,
            sankey: {
                node: { row: 3, col: 2 },
                links: [
                    { source: "wages", target: "pretaxDeductions", row: 1, col: 1 },
                ],
            },
        },
        {
            id: "input-pretax-traditionalIra",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "Traditional IRA (deductible)", compact: "Traditional IRA" },
            description:
                "Deductible traditional IRA contributions you fund outside payroll — not employer deferrals",
            kindDetail: {
                limitNote: "Annual contribution limit applies per spouse",
                modelingNote:
                    "Deductibility phase-outs (MAGI, workplace plan coverage, spouse coverage) are not modeled; treat amounts as fully deductible if you use this row",
            },
            input: {
                category: "pretax",
                displayOrder: 4,
                inputType: "currency",
                subcategories: [
                    { key: "input-pretax-traditionalIra-traditionalIraSpouse1", labelSingle: "Traditional IRA (deductible)", labelJoint: "Traditional IRA (deductible) (spouse 1)" },
                    { key: "input-pretax-traditionalIra-traditionalIraSpouse2", labelSingle: "Traditional IRA (deductible) (2)", labelJoint: "Traditional IRA (deductible) (spouse 2)" },
                ],
                getLimit: (yearValues) => yearValues.limits["traditionalIra"] ?? 7000,
                validate: makeYearValuesCappedValidator("traditionalIra", 7000),
                showWhen: (ctx) => ctx.isJoint !== undefined,
            },
            calculate: traditionalIra,
            sankey: {
                node: { row: 4, col: 2 },
                links: [
                    { source: "wages", target: "pretaxDeductions", row: 1, col: 1 },
                ],
            },
        },
    ];
}