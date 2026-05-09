/** Ending metrics: take-home pay, effective tax rate, marginal federal rate. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { ConfigItem } from "./pageConfig.types";
import {
    totalIncome,
    calculateTaxBrackets,
    getStandardDeductionWithoutPayrollTax,
    getItemizedDeductionsWithoutPayrollTax,
} from "./taxCalculations";

export function makeEndingNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {


    return [
        {
            id: "federalPayrollTaxes",
            labels: { default: "Federal Payroll & Self-Employment Taxes", compact: "Federal Payroll / SE Tax" },
            sankey: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 2, col: 4 },
            },
        },
        {
            id: "takeHomePay",
            labels: { default: "Take-Home Pay", compact: "Take-Home Pay" },
            sankey: {
                node: { fill: "var(--sankey-node-keep)", stroke: "var(--sankey-link-keep)", row: 3, col: 4 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const keep = brackets.reduce((sum, bracket) => sum + bracket.keep + bracket.credits, 0) + getStandardDeductionWithoutPayrollTax(inputs, taxData, filingStatus) + getItemizedDeductionsWithoutPayrollTax(inputs, taxData, filingStatus);
                return keep;
            },
            summary: {
                summaryId: "take-home-pay",
                category: "takehome",
                displayOrder: 6,
                format: "currency",
                highlight: true,
            },
        },
        {
            id: "federalIncomeTax",
            labels: { default: "Federal Income Tax", compact: "Federal Income Tax" },
            sankey: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 4, col: 4 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const tax = brackets.reduce((sum, bracket) => sum + bracket.tax, 0);
                return tax;
            },
            summary: {
                summaryId: "federal-income-tax",
                category: "tax",
                displayOrder: 4,
                format: "currency",
                highlight: true,
            },
        },

        {
            id: "effectiveTaxRate",
            labels: { default: "Effective Tax Rate", compact: "Effective Rate" },
            calculate: (inputs) => {
                const gross = totalIncome(inputs);
                if (gross <= 0) return 0;
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const federalTax = brackets.reduce((sum, bracket) => sum + bracket.tax, 0);
                return federalTax / gross;
            },
            summary: {
                summaryId: "effective-tax-rate",
                category: "rate",
                displayOrder: 7,
                format: "percent",
            },
        },
    ];
}
