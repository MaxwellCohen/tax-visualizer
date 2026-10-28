/** Ending metrics: take-home pay, federal and state income tax, effective tax rate. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";

export function makeEndingNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
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
            description:
                "Modeled cash after pre-tax deferrals, federal and state income tax, and payroll taxes",
            sankey: {
                node: { row: 3, col: 4 },
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => context.takeHomePay,
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
            calculate: (_inputs, _taxData, _filingStatus, context) => context.federalIncomeTax,
            summary: {
                displayOrder: 4,
                format: "currency",
                highlight: true,
            },
        },
        {
            id: "stateIncomeTax",
            chartRole: "tax",
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "State Income Tax", compact: "State Income Tax" },
            description: "State income tax on federal AGI after the state standard deduction and exemptions (no phaseouts, credits, or local tax)",
            calculate: (_inputs, _taxData, _filingStatus, context) => context.stateIncomeTax,
            summary: {
                displayOrder: 4.5,
                format: "currency",
                hideWhenZero: true,
            },
        },

        {
            id: "effectiveTaxRate",
            chartRole: "rate",
            labels: { default: "Effective income-tax rate", compact: "Income-tax rate", summary: "Effective income-tax rate" },
            description: "Federal plus state income tax divided by total modeled gross income (excludes payroll and self-employment tax)",
            calculate: (_inputs, _taxData, _filingStatus, context) => context.effectiveTaxRate,
            summary: {
                displayOrder: 7,
                format: "percent",
            },
        },
    ];
}
