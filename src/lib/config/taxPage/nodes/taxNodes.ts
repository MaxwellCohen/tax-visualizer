/** Tax nodes: payroll tax, self-employment tax, and ordinary-income ribbons into payroll and state tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { deductionPayrollSplitFromContext, takeHomeAllocation } from "~/lib/tax/charts/sankeyMoneyFlow";

export function makeTaxNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "sankeyOrdinaryToPayrollTax",
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Ordinary income to payroll / SE hub", compact: "Ordinary → payroll" },
            description: "Payroll and self-employment tax drawn from ordinary income, beside the deduction that is kept",
            calculate: (_inputs, _taxData, _filingStatus, context) =>
                deductionPayrollSplitFromContext(context).payrollFromDeduction,
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
            calculate: (_inputs, _taxData, _filingStatus, context) => context.selfEmploymentTax,
            summary: {
                displayOrder: 6,
                format: "currency",
            },
        },
        {
            id: "sankeyHalfSeToTakeHome",
            chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: "½ self-employment tax kept", compact: "½ SE tax kept" },
            description: "Deductible half of self-employment tax. It is still cash, so it flows to take-home instead of disappearing from the income stack.",
            calculate: (_inputs, _taxData, _filingStatus, context) => takeHomeAllocation(context).halfSe.net,
        },
        {
            id: "sankeyOrdinaryToStateTax",
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Ordinary income to state income tax", compact: "Ordinary → state" },
            description: "State income tax paid out of the kept deduction and ½ self-employment tax when bracket keep is not enough",
            calculate: (_inputs, _taxData, _filingStatus, context) => {
                const allocation = takeHomeAllocation(context);
                return allocation.deduction.state + allocation.halfSe.state;
            },
        },
    ];
}
