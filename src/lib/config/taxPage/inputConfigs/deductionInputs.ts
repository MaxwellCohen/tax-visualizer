/** Deduction inputs: standard, SALT, medical, mortgage, charity. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { nonNegativeValidator, makeSaltCappedValidator } from "../inputValidators";

export function makePayrollTaxInputConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "payrollTax",
            chartRole: "tax",
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Payroll Taxes", compact: "Payroll Taxes", summary: "Payroll Tax" },
            description: "Withholding-style payroll tax on wages (FICA) and related flow in the Sankey",
            sankey: {
                node: { row: 2, col: 3 },
                links: [
                    { source: "payrollTax", target: "federalPayrollTaxes", row: 2, col: 3 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => context.payrollTax,
            summary: {
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
            chartRole: "deduction",
            labels: { default: "Standard deduction", compact: "Standard", summary: "Standard Deduction" },
            description: "Standard deduction based on filing status",
            kindDetail: {
                modelingNote: "Used when the itemized-deductions checkbox is off",
            },
            sankey: {
                links: [
                    { source: "ordinaryTaxableIncome", target: "standardDeduction", row: 1, col: 2 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) =>
                context.standardDeduction,
            summary: {
                displayOrder: 2.5,
                format: "currency",
                hideWhenZero: true,
            },
        },
        {
            id: "Itemized Deductions",
            chartRole: "deduction",
            labels: { default: "Itemized Deductions", compact: "Itemized" },
            description: "Itemized deductions based on filing status",
            kindDetail: {
                modelingNote: "Used when you check “Use itemized deductions”",
            },
            sankey: {
                links: [
                    { source: "ordinaryTaxableIncome", target: "itemizedDeductions", row: 1, col: 2 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) =>
                context.metrics.useItemizedDeductions ? context.itemizedDeductions : 0,
            summary: {
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
                    "Clamped to this year’s SALT cap for your filing status. MAGI-based SALT reduction for very high incomes is not modeled.",
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
            description: "Medical and dental expenses you can deduct after the 7.5% of AGI floor",
            kindDetail: {
                modelingNote: "Enter the deductible amount after the 7.5% of AGI floor; this model does not apply that floor for you",
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
                modelingNote: "Enter deductible interest after the $750k acquisition-debt limit (pre-2018: $1M); this model does not apply that cap",
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
                limitNote: "60% of AGI limit applies to cash contributions to public charities",
                modelingNote:
                    "Non-cash donations often face lower AGI percentage caps (e.g. 50% / 30%); this model does not split cash vs property",
            },
            input: {
                category: "deduction",
                displayOrder: 5,
                inputType: "currency",
                subcategories: [{ key: "deduction-charitable-charitable", labelSingle: "Charitable contributions", labelJoint: "Charitable contributions" }],
                validate: nonNegativeValidator,
            },
            // calculate: charitable
        },
    ];
}