/** Deduction inputs: standard, SALT, medical, mortgage, charity. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { calculatePayrollTax } from "~/lib/config/page/taxCalculations";
import { getItemizedDeductionsWithoutPayrollTax, getStandardDeductionWithoutPayrollTax, nonNegativeValidator, makeSaltCappedValidator } from "./pageConfig.helpers";


export function makePayrollFromWagesInputConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "payrollTaxWages",
            label: "Payroll Taxes",
            shortLabel: "Payroll Taxes",
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
            label: "Standard deduction",
            shortLabel: "Standard",
            description: "Standard deduction based on filing status",
            kindDetail: {
                modelingNote: "Applied automatically if greater than itemized deductions",
            },
            sankeySettings: {
                // node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "standardDeduction", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                ],
            },
            calculate: getStandardDeductionWithoutPayrollTax
        },
        {
            id: "Itemized Deductions",
            label: "Itemized Deductions",
            shortLabel: "Itemized",
            description: "Itemized deductions based on filing status",
            kindDetail: {
                modelingNote: "Applied automatically if greater than standard deduction",
            },
            sankeySettings: {
                // node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "itemizedDeductions", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                ],
            },
            calculate: getItemizedDeductionsWithoutPayrollTax
        },
        {
            id: "deduction-salt",
            label: "State & Local Taxes (SALT)",
            shortLabel: "SALT",
            description: "State and local taxes you elect to deduct",
            kindDetail: {
                limitNote:
                    "Annual cap on combined state/local income, sales, and property taxes (varies by tax year and filing status). MAGI-based SALT reduction for very high incomes is not modeled.",
            },
            inputRowSettings: {
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
                validate: nonNegativeValidator,
            },
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
                validate: nonNegativeValidator,
            },
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
                validate: nonNegativeValidator,
            },
            // sankeySettings: {
            //     // node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
            //     // link: [
            //     //     { source: "ordinaryTaxableIncome", target: "itemizedDeductions", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 3, col: 2 },
            //     // ],
            // },
            // calculate: charitable
        },
    ];
}