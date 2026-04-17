/** Deduction inputs: standard, SALT, medical, mortgage, charity. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { TaxFormRow } from "~/lib/taxForm.types";
import { calculatePayrollTax } from "~/lib/config/page/pageConfig.finalTaxContext";
import { charitable, medicalDental, mortgageInterest, salt, useItemizedDeductions } from "./pageConfig.inputs";
import { getStandardDeduction } from "./pageConfig.helpers";


export function makePayrollFromWagesInputConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "payrollTaxWages",
            label: "Payroll Taxes",
            shortLabel: "Payroll Taxes",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "payrollTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: 0, col: 2 },
                ],
            },
            calculate: calculatePayrollTax,
            summary: {
                summaryId: "payroll-tax",
                label: "Payroll Tax",
                category: "tax",
                displayOrder: 5,
                format: "currency",
            },
        },
    ];
}

export function makePayrollTaxInputConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "payrollTax",
            label: "Payroll Taxes",
            shortLabel: "Payroll Taxes",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 2, col: 3 },
                link: [
                    { source: "payrollTax", target: "federalPayrollTaxes", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: 2, col: 3 },
                ],
            },
            calculate: calculatePayrollTax,
            summary: {
                summaryId: "payroll-tax",
                label: "Payroll Tax",
                category: "tax",
                displayOrder: 5,
                format: "currency",
            },
        },
    ]
}

export function makeDeductionInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [

        {
            id: "standard",
            label: "0% tax (standard deduction)",
            shortLabel: "Standard",
            description: "Standard deduction based on filing status",
            kindDetail: {
                modelingNote: "Applied automatically if greater than itemized deductions",
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "standardDeduction", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                ],
            },
            calculate: getStandardDeduction
        },
        {
            id: "deduction-salt",
            label: "State & Local Taxes (SALT)",
            shortLabel: "deduction-salt",
            description: "State and local taxes you elect to deduct",
            kindDetail: {
                limitNote: "$10,000 cap (single) / $10,000 (married)",
            },
            inputRowSettings: {
                category: "deduction",
                displayOrder: 2,
                inputType: "currency",
                subcategories: [{ key: "deduction-salt-salt", labelSingle: "State & local taxes (SALT)", labelJoint: "State & local taxes (SALT)" }],
                getFilingStatusLimit: (yearValues, filingStatus) => yearValues.caps.salt[filingStatus] ?? 10000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.caps.salt[ctx.filingStatus] ?? 10000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "itemizedDeductions", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 0, col: 2 },
                ],
            },
            calculate: salt
        },
        {
            id: "deduction-medicalDental",
            label: "Medical & Dental",
            shortLabel: "Medical",
            description: "Medical and dental expenses (7.5% of AGI threshold applied at calculation)",
            kindDetail: {
                modelingNote: "Subject to 7.5% of AGI threshold",
            },
            inputRowSettings: {
                category: "deduction",
                displayOrder: 3,
                inputType: "currency",
                subcategories: [{ key: "deduction-medicalDental-medicalDental", labelSingle: "Medical & dental", labelJoint: "Medical & dental" }],
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "itemizedDeductions", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 0, col: 2 },
                ],
            },
            calculate: medicalDental
        },
        {
            id: "deduction-mortgageInterest",
            label: "Home Mortgage Interest",
            shortLabel: "Mortgage",
            description: "Home mortgage interest",
            kindDetail: {
                modelingNote: "Limited to first $750k of acquisition debt (pre-2018: $1M)",
            },
            inputRowSettings: {
                category: "deduction",
                displayOrder: 4,
                inputType: "currency",
                subcategories: [{ key: "deduction-mortgageInterest-mortgageInterest", labelSingle: "Home mortgage interest", labelJoint: "Home mortgage interest" }],
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "itemizedDeductions", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 0, col: 2 },
                ],
            },
            calculate: mortgageInterest
        },
        {
            id: "deduction-charitable",
            label: "Charitable Contributions",
            shortLabel: "Charity",
            description: "Cash and non-cash contributions to qualified charities",
            kindDetail: {
                limitNote: "60% of AGI limit for cash contributions",
            },
            inputRowSettings: {
                category: "deduction",
                displayOrder: 5,
                inputType: "currency",
                subcategories: [{ key: "deduction-charitable-charitable", labelSingle: "Charitable contributions", labelJoint: "Charitable contributions" }],
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "itemizedDeductions", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 3, col: 2 },
                ],
            },
            calculate: charitable
        },
    ];
}