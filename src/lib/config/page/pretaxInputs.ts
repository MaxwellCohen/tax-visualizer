/** Pre-tax inputs: 401(k), HSA, traditional IRA, other payroll pre-tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { _401k } from "./pageConfig.finalTaxContext";

export function makePretaxInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "input-401k",
            label: "401(k) Deferrals",
            shortLabel: "401(k)",
            description: "Elective deferrals from W-2 pay",
            kindDetail: {
                limitNote: "elective deferral per employee (catch-up not modeled)",
            },
            inputRowSettings: {
                displayOrder: 1,
                inputType: "currency",
                getLimit: (yearValues) => yearValues.limits["401k"] ?? 23000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.limits["401k"] ?? 23000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
                getSpouseLabels: () => ({ single: "401(k) deferrals", joint: "401(k) deferrals — Spouse 1", spouse1: "401(k) — Spouse 1", spouse2: "401(k) — Spouse 2" }),
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
            id: "hsa",
            label: "HSA (payroll)",
            shortLabel: "HSA",
            description: "Payroll HSA contributions",
            kindDetail: {
                limitNote: "payroll HSA contributions toward HDHP limits",
            },
            inputRowSettings: {
                displayOrder: 2,
                inputType: "currency",
                getFilingStatusLimit: (yearValues, filingStatus) => {
                    const isJoint = filingStatus === "marriedJoint";
                    return isJoint ? (yearValues.limits["hsaFamily"] ?? 8300) : (yearValues.limits["hsaSelfOnly"] ?? 4150);
                },
                validate: (value, ctx) => {
                    const isJoint = ctx.filingStatus === "marriedJoint";
                    const limit = isJoint ? (ctx.yearValues.limits["hsaFamily"] ?? 8300) : (ctx.yearValues.limits["hsaSelfOnly"] ?? 4150);
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
                showWhen: (ctx) => ctx.isJoint !== undefined,
                getSpouseLabels: () => ({ single: "HSA (payroll)", joint: "HSA (payroll) — Spouse 1", spouse1: "HSA — Spouse 1", spouse2: "HSA — Spouse 2" }),
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 2, col: 3 },
                link: [
                    { source: "wages", target: "pretaxDeductions", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 1 },
                ],
            },
        },
        {
            id: "otherPretax",
            label: "Other Pre-tax (payroll)",
            shortLabel: "Other Pre-tax",
            description: "Miscellaneous payroll amounts taken pre-tax",
            kindDetail: {
                limitNote: "miscellaneous payroll amounts taken pre-tax",
            },
            inputRowSettings: {
                displayOrder: 3,
                inputType: "currency",
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
            id: "input-traditionalIra",
            label: "Traditional IRA (deductible)",
            shortLabel: "Traditional IRA",
            description: "Traditional IRA (deductible)",
            kindDetail: {
                limitNote: "Traditional IRA (deductible in this flow)",
            },
            inputRowSettings: {
                displayOrder: 4,
                inputType: "currency",
                getLimit: (yearValues) => yearValues.limits["traditionalIra"] ?? 7000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.limits["traditionalIra"] ?? 7000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
                showWhen: (ctx) => ctx.isJoint !== undefined,
                getSpouseLabels: () => ({ single: "Traditional IRA (deductible)", joint: "Traditional IRA — Spouse 1", spouse1: "Traditional IRA — Spouse 1", spouse2: "Traditional IRA — Spouse 2" }),
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
