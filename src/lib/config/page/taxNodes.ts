/** Tax nodes: federal income tax, payroll tax, self-employment tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    calculatePayrollTax,
    calculateSelfEmploymentTax,
    computeFederalTaxCreditsApplied,
} from "./taxCalculations";
import {
    totalCredits,
} from "./pageConfig.inputs";

export function makeTaxNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const creditsHubNode = {
        fill: "var(--sankey-node-credits)",
        stroke: "var(--sankey-link-credits)",
        col: 3,
        row: 40,
    } as const;

    return [
        {
            id: "federalTaxCredits",
            label: "Federal Tax Credits",
            shortLabel: "Credits",
            sankeySettings: {
                node: creditsHubNode,
            },
            calculate: totalCredits,
        },
        {
            id: "sankeyOrdinaryToFederalTaxCredits",
            label: "Ordinary income to federal credits",
            shortLabel: "Ordinary → credits",
            calculate: (inputs) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
        },
        {
            id: "sankeyFederalTaxCreditsToTakeHome",
            label: "Federal credits to take-home",
            shortLabel: "Credits → take-home",
            calculate: (inputs) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
        },
        {
            id: "sankeyOrdinaryToPayrollTax",
            label: "Ordinary income to payroll / SE hub",
            shortLabel: "Ordinary → payroll",
            calculate: (inputs, td, fs) => calculatePayrollTax(inputs, td, fs) + calculateSelfEmploymentTax(inputs, td),
            sankeySettings: {
                link: [
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
            label: "Self-Employment Tax",
            shortLabel: "Self-Employment Tax",
            sankeySettings: {
                link: [
                    { source: "payrollTax", target: "federalPayrollTaxes", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
                ],
            },
            calculate: (inputs, taxData) => calculateSelfEmploymentTax(inputs, taxData),
            summary: {
                summaryId: "self-employment-tax",
                label: "Self-Employment Tax",
                category: "tax",
                displayOrder: 6,
                format: "currency",
            },
        },
    ];
}
