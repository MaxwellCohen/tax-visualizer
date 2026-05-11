/** Tax nodes: federal income tax, payroll tax, self-employment tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { calculatePayrollTax, calculateSelfEmploymentTax } from "../calc/taxCalculations";

export function makeTaxNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "sankeyOrdinaryToPayrollTax",
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Ordinary income to payroll / SE hub", compact: "Ordinary → payroll" },
            description: "Ordinary income routed toward wage payroll tax and self-employment tax",
            calculate: (inputs, td, fs) => calculatePayrollTax(inputs, td, fs) + calculateSelfEmploymentTax(inputs, td, fs),
            sankey: {
                links: [
                    {
                        source: "ordinaryTaxableIncome",
                        target: "payrollTax",
                        row: 0,
                        col: 2,
                    },
                ],
            },
        },
        {
            id: "selfEmploymentTax",
            chartRole: "tax",
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Self-Employment Tax", compact: "Self-Employment Tax" },
            description: "Self-employment (SECA) tax on net earnings from self-employment",
            sankey: {
                links: [
                    { source: "payrollTax", target: "federalPayrollTaxes", row: 4, col: 1 },
                ],
            },
            calculate: (inputs, taxData) => calculateSelfEmploymentTax(inputs, taxData, filingStatus),
            summary: {
                displayOrder: 6,
                format: "currency",
            },
        },
    ];
}
