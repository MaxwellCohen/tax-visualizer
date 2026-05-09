/** Ending metrics: take-home pay, effective tax rate, marginal federal rate. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    totalIncome,
    calculateTaxBrackets,
    getStandardDeductionWithoutPayrollTax,
    getItemizedDeductionsWithoutPayrollTax,
} from "./taxCalculations";

export function makeEndingNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {


    return [
        {
            id: "federalPayrollTaxes",
            label: "Federal Payroll & Self-Employment Taxes",
            shortLabel: "Federal Payroll / SE Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 2, col: 4 },
            },
        },
        {
            id: "takeHomePay",
            label: "Take-Home Pay",
            shortLabel: "Take-Home Pay",
            sankeySettings: {
                node: { fill: "var(--sankey-node-keep)", stroke: "var(--sankey-link-keep)", row: 3, col: 4 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const keep = brackets.reduce((sum, bracket) => sum + bracket.keep + bracket.credits, 0) + getStandardDeductionWithoutPayrollTax(inputs, taxData, filingStatus) + getItemizedDeductionsWithoutPayrollTax(inputs, taxData, filingStatus);
                return keep;
            },
            summary: {
                summaryId: "take-home-pay",
                label: "Take-Home Pay",
                category: "takehome",
                displayOrder: 6,
                format: "currency",
                highlight: true,
            },
        },
        {
            id: "federalIncomeTax",
            label: "Federal Income Tax",
            shortLabel: "Federal Income Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 4, col: 4 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const tax = brackets.reduce((sum, bracket) => sum + bracket.tax, 0);
                return tax;
            },
            summary: {
                summaryId: "federal-income-tax",
                label: "Federal Income Tax",
                category: "tax",
                displayOrder: 4,
                format: "currency",
                highlight: true,
            },
        },

        {
            id: "effectiveTaxRate",
            label: "Effective Tax Rate",
            shortLabel: "Effective Rate",
            calculate: (inputs) => {
                const gross = totalIncome(inputs);
                if (gross <= 0) return 0;
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const federalTax = brackets.reduce((sum, bracket) => sum + bracket.tax, 0);
                return federalTax / gross;
            },
            summary: {
                summaryId: "effective-tax-rate",
                label: "Effective Tax Rate",
                category: "rate",
                displayOrder: 7,
                format: "percent",
            },
        },
    ];
}
