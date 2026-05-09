/** Deduction inputs: standard, SALT, medical, mortgage, charity. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { ConfigItem } from "./pageConfig.types";
import { calculatePayrollTax, getItemizedDeductionsWithoutPayrollTax, getStandardDeductionWithoutPayrollTax } from "~/lib/config/page/taxCalculations";
import { nonNegativeValidator, makeSaltCappedValidator } from "./inputValidators";


export function makePayrollFromWagesInputConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "payrollTaxWages",
            labels: { default: "Payroll Taxes", compact: "Payroll Taxes" },
            calculate: calculatePayrollTax,
        },
    ];
}

export function makePayrollTaxInputConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "payrollTax",
            labels: { default: "Payroll Taxes", compact: "Payroll Taxes", summary: "Payroll Tax" },
            sankey: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 2, col: 3 },
                links: [
                    { source: "payrollTax", target: "federalPayrollTaxes", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: 2, col: 3 },
                ],
            },
            calculate: calculatePayrollTax,
            summary: {
                summaryId: "payroll-tax",
                category: "tax",
                displayOrder: 5,
                format: "currency",
            },
        },
    ]
}

export function makeDeductionInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [

        {
            id: "standard",
            labels: { default: "Standard deduction", compact: "Standard", summary: "Standard Deduction" },
            description: "Standard deduction based on filing status",
            kindDetail: {
                modelingNote: "Applied automatically if greater than itemized deductions",
            },
            sankey: {
                // node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                links: [
                    { source: "ordinaryTaxableIncome", target: "standardDeduction", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                ],
            },
            calculate: getStandardDeductionWithoutPayrollTax,
            summary: {
                summaryId: "standard-deduction",
                category: "deduction",
                displayOrder: 2.5,
                format: "currency",
                hideWhenZero: true,
            },
        },
        {
            id: "Itemized Deductions",
            labels: { default: "Itemized Deductions", compact: "Itemized" },
            description: "Itemized deductions based on filing status",
            kindDetail: {
                modelingNote: "Applied automatically if greater than standard deduction",
            },
            sankey: {
                // node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                links: [
                    { source: "ordinaryTaxableIncome", target: "itemizedDeductions", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                ],
            },
            calculate: getItemizedDeductionsWithoutPayrollTax,
            summary: {
                summaryId: "itemized-deductions",
                category: "deduction",
                displayOrder: 2.5,
                format: "currency",
                hideWhenZero: true,
            },
        },
        {
            id: "deduction-salt",
            labels: { default: "State & Local Taxes (SALT)", compact: "SALT" },
            description: "State and local taxes you elect to deduct",
            kindDetail: {
                limitNote:
                    "Annual cap on combined state/local income, sales, and property taxes (varies by tax year and filing status). MAGI-based SALT reduction for very high incomes is not modeled.",
            },
            input: {
                category: "deduction",
                displayOrder: 2,
                inputType: "currency",
                subcategories: [{ key: "deduction-salt-salt", labelSingle: "State & local taxes (SALT)", labelJoint: "State & local taxes (SALT)" }],
                getFilingStatusLimit: (yearValues, filingStatus) => yearValues.caps.salt[filingStatus] ?? 10000,
                validate: makeSaltCappedValidator,
            },
        },
        {
            id: "deduction-medicalDental",
            labels: { default: "Medical & Dental", compact: "Medical" },
            description: "Medical and dental expenses (7.5% of AGI threshold applied at calculation)",
            kindDetail: {
                modelingNote: "Subject to 7.5% of AGI threshold",
            },
            input: {
                category: "deduction",
                displayOrder: 3,
                inputType: "currency",
                subcategories: [{ key: "deduction-medicalDental-medicalDental", labelSingle: "Medical & dental", labelJoint: "Medical & dental" }],
                validate: nonNegativeValidator,
            },
        },
        {
            id: "deduction-mortgageInterest",
            labels: { default: "Home Mortgage Interest", compact: "Mortgage" },
            description: "Home mortgage interest",
            kindDetail: {
                modelingNote: "Limited to first $750k of acquisition debt (pre-2018: $1M)",
            },
            input: {
                category: "deduction",
                displayOrder: 4,
                inputType: "currency",
                subcategories: [{ key: "deduction-mortgageInterest-mortgageInterest", labelSingle: "Home mortgage interest", labelJoint: "Home mortgage interest" }],
                validate: nonNegativeValidator,
            },
        },
        {
            id: "deduction-charitable",
            labels: { default: "Charitable Contributions", compact: "Charity" },
            description: "Cash and non-cash contributions to qualified charities",
            kindDetail: {
                limitNote: "60% of AGI limit for cash contributions",
            },
            input: {
                category: "deduction",
                displayOrder: 5,
                inputType: "currency",
                subcategories: [{ key: "deduction-charitable-charitable", labelSingle: "Charitable contributions", labelJoint: "Charitable contributions" }],
                validate: nonNegativeValidator,
            },
            // sankey: {
            //     // node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
            //     // link: [
            //     //     { source: "ordinaryTaxableIncome", target: "itemizedDeductions", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 3, col: 2 },
            //     // ],
            // },
            // calculate: charitable
        },
    ];
}