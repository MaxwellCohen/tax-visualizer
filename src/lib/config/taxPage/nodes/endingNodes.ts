/** Ending metrics: take-home pay, effective tax rate, marginal federal rate. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { totalIncome } from "../rowMetrics";
import {
    calculateTaxBuckets,
    getStandardDeductionWithoutPayrollTax,
    getItemizedDeductionsWithoutPayrollTax,
} from "../calc/taxCalculations";

export function makeEndingNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "federalPayrollTaxes",
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Federal Payroll", compact: "Federal Payroll" },
            description: "Combined federal payroll taxes from wages and self-employment",
            sankey: {
                node: { row: 2, col: 4 },
            },
        },
        {
            id: "takeHomePay",
            chartRole: "takehome",
            chartStyle: { fill: "var(--color-chart-keep)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: "Take-Home Pay", compact: "Take-Home Pay" },
            description: "After-tax keep, deduction shield, and credited amounts in this visualization",
            sankey: {
                node: { row: 3, col: 4 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const brackets = calculateTaxBuckets(inputs, taxData, filingStatus);
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
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Federal Income Tax", compact: "Federal Income Tax" },
            description: "Federal income tax on ordinary and LTCG brackets before payroll taxes",
            sankey: {
                node: { row: 4, col: 4 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const brackets = calculateTaxBuckets(inputs, taxData, filingStatus);
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
            description: "Federal income tax divided by total modeled gross income",
            calculate: (inputs) => {
                const gross = totalIncome(inputs);
                if (gross <= 0) return 0;
                const brackets = calculateTaxBuckets(inputs, taxData, filingStatus);
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
