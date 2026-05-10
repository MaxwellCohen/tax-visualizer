/** Ending metrics: take-home pay, effective tax rate, marginal federal rate. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { totalIncome } from "../rowMetrics";
import {
    calculateTaxBrackets,
    getStandardDeductionWithoutPayrollTax,
    getItemizedDeductionsWithoutPayrollTax,
} from "../calc/taxCalculations";

export function makeEndingNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "federalPayrollTaxes",
            chartStyle: { fill: "var(--chart-tax)", stroke: "var(--sankey-link-tax)" },
            labels: { default: "Federal Payroll", compact: "Federal Payroll" },
            sankey: {
                node: { row: 2, col: 4 },
            },
        },
        {
            id: "takeHomePay",
            chartRole: "takehome",
            chartStyle: { fill: "var(--chart-keep)", stroke: "var(--sankey-link-keep)" },
            labels: { default: "Take-Home Pay", compact: "Take-Home Pay" },
            sankey: {
                node: { row: 3, col: 4 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const keep = brackets.reduce((sum, bracket) => sum + bracket.keep + bracket.credits, 0) + getStandardDeductionWithoutPayrollTax(inputs, taxData, filingStatus) + getItemizedDeductionsWithoutPayrollTax(inputs, taxData, filingStatus);
                return keep;
            },
            summary: {
                displayOrder: 6,
                format: "currency",
                highlight: true,
            },
        },
        {
            id: "federalIncomeTax",
            chartRole: "tax",
            chartStyle: { fill: "var(--chart-tax)", stroke: "var(--sankey-link-tax)" },
            labels: { default: "Federal Income Tax", compact: "Federal Income Tax" },
            sankey: {
                node: { row: 4, col: 4 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const tax = brackets.reduce((sum, bracket) => sum + bracket.tax, 0);
                return tax;
            },
            summary: {
                displayOrder: 4,
                format: "currency",
                highlight: true,
            },
        },

        {
            id: "effectiveTaxRate",
            chartRole: "rate",
            labels: { default: "Effective Tax Rate", compact: "Effective Rate" },
            calculate: (inputs) => {
                const gross = totalIncome(inputs);
                if (gross <= 0) return 0;
                const brackets = calculateTaxBrackets(inputs, taxData, filingStatus);
                const federalTax = brackets.reduce((sum, bracket) => sum + bracket.tax, 0);
                return federalTax / gross;
            },
            summary: {
                displayOrder: 7,
                format: "percent",
            },
        },
    ];
}
