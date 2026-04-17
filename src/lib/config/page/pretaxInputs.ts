/** Pre-tax inputs: 401(k), HSA, traditional IRA, other payroll pre-tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { _401k } from "./pageConfig.finalTaxContext";

export function makePretaxInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "input-pretax-401K",
            label: "401(k) Deferrals",
            shortLabel: "401(k)",
            description: "Elective deferrals from W-2 pay",
            kindDetail: {
                limitNote: "elective deferral per employee (catch-up not modeled)",
            },
            inputRowSettings: {
                category: "pretax",
                displayOrder: 1,
                inputType: "currency",
                subcategories: [
                    { key: "input-pretax-401K-preTax401kSpouse1", labelSingle: "401(k) deferrals", labelJoint: "401(k) deferrals" },
                    { key: "input-pretax-401K-preTax403bSpouse1", labelSingle: "403(b) deferrals", labelJoint: "403(b) deferrals" },
                    { key: "input-pretax-401K-preTax457bSpouse1", labelSingle: "457(b) deferrals", labelJoint: "457(b) deferrals" },
                    { key: "input-pretax-401K-preTax401kSpouse2", labelSingle: "401(k) deferrals (2)", labelJoint: "401(k) deferrals (2)" },
                    { key: "input-pretax-401K-preTax403bSpouse2", labelSingle: "403(b) deferrals (2)", labelJoint: "403(b) deferrals (2)" },
                    { key: "input-pretax-401K-preTax457bSpouse2", labelSingle: "457(b) deferrals (2)", labelJoint: "457(b) deferrals (2)" },
                ],
                getLimit: (yearValues) => yearValues.limits["401k"] ?? 23000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.limits["401k"] ?? 23000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
            },
            calculate: _401k, 
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 2 },
                link: [
                    { source: "wages", target: "pretaxDeductions", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 1 },
                ],
            },
        },
        {
            id: "input-pretax-hsa",
            label: "HSA (payroll)",
            shortLabel: "HSA",
            description: "Payroll HSA contributions",
            kindDetail: {
                limitNote: "payroll HSA contributions toward HDHP limits",
            },
            inputRowSettings: {
                category: "pretax",
                displayOrder: 2,
                inputType: "currency",
                subcategories: [
                    { key: "input-pretax-hsa-preTaxHsaSpouse1", labelSingle: "HSA (payroll)", labelJoint: "HSA (payroll)" },
                    { key: "input-pretax-hsa-preTaxHsaSpouse2", labelSingle: "HSA (payroll) (2)", labelJoint: "HSA (payroll) (2)" },
                ],
                getFilingStatusLimit: (yearValues, filingStatus) => {
                    const isJoint = filingStatus === "marriedJoint";
                    return isJoint ? (yearValues.limits["input-pretax-hsaFamily"] ?? 8300) : (yearValues.limits["input-pretax-hsaSelfOnly"] ?? 4150);
                },
                validate: (value, ctx) => {
                    const isJoint = ctx.filingStatus === "marriedJoint";
                    const limit = isJoint ? (ctx.yearValues.limits["input-pretax-hsaFamily"] ?? 8300) : (ctx.yearValues.limits["input-pretax-hsaSelfOnly"] ?? 4150);
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
                showWhen: (ctx) => ctx.isJoint !== undefined,
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 2, col: 3 },
                link: [
                    { source: "wages", target: "pretaxDeductions", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 1 },
                ],
            },
        },
        {
            id: "input-pretax-otherPretax",
            label: "Other Pre-tax (payroll)",
            shortLabel: "Other Pre-tax",
            description: "Miscellaneous payroll amounts taken pre-tax",
            kindDetail: {
                limitNote: "miscellaneous payroll amounts taken pre-tax",
            },
            inputRowSettings: {
                category: "pretax",
                displayOrder: 3,
                inputType: "currency",
                subcategories: [
                    { key: "input-pretax-otherPretax-preTaxOther", labelSingle: "Other payroll pre-tax", labelJoint: "Other payroll pre-tax" },
                    { key: "input-pretax-otherPretax-preTaxHealthFsaSpouse1", labelSingle: "Health FSA (payroll)", labelJoint: "Health FSA (payroll)" },
                    { key: "input-pretax-otherPretax-preTaxHealthFsaSpouse2", labelSingle: "Health FSA (payroll) (2)", labelJoint: "Health FSA (payroll) (2)" },
                    { key: "input-pretax-otherPretax-preTaxDependentCareFsaSpouse1", labelSingle: "Dependent care FSA (payroll)", labelJoint: "Dependent care FSA (payroll)" },
                    { key: "input-pretax-otherPretax-preTaxDependentCareFsaSpouse2", labelSingle: "Dependent care FSA (payroll) (2)", labelJoint: "Dependent care FSA (payroll) (2)" },
                    { key: "input-pretax-otherPretax-preTaxCommuterSpouse1", labelSingle: "Commuter / parking (payroll)", labelJoint: "Commuter / parking (payroll)" },
                    { key: "input-pretax-otherPretax-preTaxCommuterSpouse2", labelSingle: "Commuter / parking (payroll) (2)", labelJoint: "Commuter / parking (payroll) (2)" },
                ],
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 3, col: 2 },
                link: [
                    { source: "wages", target: "pretaxDeductions", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 1 },
                ],
            },
        },
        {
            id: "input-pretax-traditionalIra",
            label: "Traditional IRA (deductible)",
            shortLabel: "Traditional IRA",
            description: "Traditional IRA (deductible)",
            kindDetail: {
                limitNote: "Traditional IRA (deductible in this flow)",
            },
            inputRowSettings: {
                category: "pretax",
                displayOrder: 4,
                inputType: "currency",
                subcategories: [
                    { key: "input-pretax-traditionalIra-traditionalIraSpouse1", labelSingle: "Traditional IRA (deductible)", labelJoint: "Traditional IRA (deductible)" },
                    { key: "input-pretax-traditionalIra-traditionalIraSpouse2", labelSingle: "Traditional IRA (deductible) (2)", labelJoint: "Traditional IRA (deductible) (2)" },
                ],
                getLimit: (yearValues) => yearValues.limits["traditionalIra"] ?? 7000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.limits["traditionalIra"] ?? 7000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
                showWhen: (ctx) => ctx.isJoint !== undefined,
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 4, col: 2 },
                link: [
                    { source: "wages", target: "pretaxDeductions", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 1 },
                ],
            },
        },
    ];
}