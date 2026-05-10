/** Tax nodes: federal income tax, payroll tax, self-employment tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { ConfigItem } from "./pageConfig.types";
import {
    calculatePayrollTax,
    calculateSelfEmploymentTax,
    computeFederalTaxCreditsApplied,
} from "./taxCalculations";
import {
    totalCredits,
} from "./pageConfig.inputs";

export function makeTaxNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    const creditsHubNode = {
        fill: "var(--chart-credit)",
        stroke: "var(--sankey-link-credits)",
        col: 3,
        row: 40,
    } as const;

    return [
        {
            id: "federalTaxCredits",
            labels: { default: "Federal Tax Credits", compact: "Credits" },
            sankey: {
                node: creditsHubNode,
            },
            calculate: totalCredits,
        },
        {
            id: "sankeyOrdinaryToFederalTaxCredits",
            labels: { default: "Ordinary income to federal credits", compact: "Ordinary → credits" },
            calculate: (inputs) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
        },
        {
            id: "sankeyFederalTaxCreditsToTakeHome",
            labels: { default: "Federal credits to take-home", compact: "Credits → take-home" },
            calculate: (inputs) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
        },
        {
            id: "sankeyOrdinaryToPayrollTax",
            labels: { default: "Ordinary income to payroll / SE hub", compact: "Ordinary → payroll" },
            calculate: (inputs, td, fs) => calculatePayrollTax(inputs, td, fs) + calculateSelfEmploymentTax(inputs, td),
            sankey: {
                links: [
                    {
                        source: "ordinaryTaxableIncome",
                        target: "payrollTax",
                        fill: "var(--sankey-link-tax)",
                        stroke: "var(--sankey-link-tax)",
                        row: 0,
                        col: 2,
                    },
                ],
            },
        },
        {
            id: "selfEmploymentTax",
            chartRole: "tax",
            labels: { default: "Self-Employment Tax", compact: "Self-Employment Tax" },
            sankey: {
                links: [
                    { source: "payrollTax", target: "federalPayrollTaxes", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
                ],
            },
            calculate: (inputs, taxData) => calculateSelfEmploymentTax(inputs, taxData),
            summary: {
                displayOrder: 6,
                format: "currency",
            },
        },
    ];
}
