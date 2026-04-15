/** Deduction inputs: standard, SALT, medical, mortgage, charity. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { TaxFormRow } from "~/lib/taxForm.types";
import { findInputById } from "./pageConfig.helpers";

export function makeDeductionInputsConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "standard",
            label: "Standard Deduction",
            shortLabel: "Standard",
            description: "Standard deduction based on filing status",
            kindDetail: {
                modelingNote: "Applied automatically if greater than itemized deductions",
            },
            inputRowSettings: { displayOrder: 1, inputType: "currency" },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "ordinaryTaxableIncome", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => {
                const income = inputs.reduce((acc, row) => row.type === "income" ? acc + row.amount : acc, 0);
                const useItemized = findInputById(inputs, "useItemizedDeductions");
                const standard = Math.min(income, taxData.standardDeduction[filingStatus]);
                return !useItemized ? standard : 0;
            }
            
        },
        {
            id: "salt",
            label: "State & Local Taxes (SALT)",
            shortLabel: "SALT",
            description: "State and local taxes you elect to deduct",
            kindDetail: {
                limitNote: "$10,000 cap (single) / $10,000 (married)",
            },
            inputRowSettings: {
                displayOrder: 2,
                inputType: "currency",
                getFilingStatusLimit: (yearValues, filingStatus) => yearValues.caps.salt[filingStatus] ?? 10000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.caps.salt[ctx.filingStatus] ?? 10000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "salt", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "medicalDental",
            label: "Medical & Dental",
            shortLabel: "Medical",
            description: "Medical and dental expenses (7.5% of AGI threshold applied at calculation)",
            kindDetail: {
                modelingNote: "Subject to 7.5% of AGI threshold",
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
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "medicalDental", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "mortgageInterest",
            label: "Home Mortgage Interest",
            shortLabel: "Mortgage",
            description: "Home mortgage interest",
            kindDetail: {
                modelingNote: "Limited to first $750k of acquisition debt (pre-2018: $1M)",
            },
            inputRowSettings: {
                displayOrder: 4,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "mortgageInterest", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "charitable",
            label: "Charitable Contributions",
            shortLabel: "Charity",
            description: "Cash and non-cash contributions to qualified charities",
            kindDetail: {
                limitNote: "60% of AGI limit for cash contributions",
            },
            inputRowSettings: {
                displayOrder: 5,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "charitable", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
    ];
}
