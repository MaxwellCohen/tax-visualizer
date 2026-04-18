/** Tax nodes: federal income tax, payroll tax, self-employment tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { getCreditsSankeyRow } from "./pageConfig.helpers";
import { calculateSelfEmploymentTax, computeFederalTaxCreditsApplied } from "./taxCalculations";
import {
    totalCredits,
} from "./pageConfig.inputs";

export function makeTaxNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const creditsRow = getCreditsSankeyRow(taxData, filingStatus);

    const creditsHubNode = {
        fill: "var(--sankey-node-credits)",
        stroke: "var(--sankey-link-credits)",
        row: creditsRow,
        col: 3,
    } as const;
    const creditLinkCreditsRow = {
        fill: "var(--sankey-link-credits)",
        stroke: "var(--sankey-link-credits)",
        row: creditsRow,
        col: 3,
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
            sankeySettings: {
                link: [
                    {
                        source: "ordinaryTaxableIncome",
                        target: "federalTaxCredits",
                        ...creditLinkCreditsRow,
                    },
                ],
            },
            calculate: (inputs) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
        },
        {
            id: "sankeyFederalTaxCreditsToTakeHome",
            label: "Federal credits to take-home",
            shortLabel: "Credits → take-home",
            sankeySettings: {
                link: [
                    {
                        source: "federalTaxCredits",
                        target: "takeHomePay",
                        ...creditLinkCreditsRow,
                    },
                ],
            },
            calculate: (inputs) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
        },
        {
            id: "selfEmploymentTax",
            label: "Self-Employment Tax",
            shortLabel: "Self-Employment Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
                link: [
                    { source: "ordinaryTaxableIncome", target: "selfEmploymentTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: 0, col: 2 },
                    { source: "selfEmploymentTax", target: "federalSelfEmploymentTaxes", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
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
