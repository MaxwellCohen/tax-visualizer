/** Tax nodes: federal income tax (and credits into tax), payroll tax, self-employment tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    calculateLtcgTaxTotal,
    calculateOrdinaryTaxTotal,
    getOrdinaryBrackets,
} from "./pageConfig.helpers";
import { calculateTaxableIncome, calculateSelfEmploymentTax } from "./taxCalculations";
import {
    childTaxCredit,
    educationCredits,
    retirementSavingsContributions,
    otherCredit,
    totalCredits,
} from "./pageConfig.inputs";

export function makeTaxNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "federalIncomeTaxBeforeCredits",
            label: "Fed Tax Before Credits",
            shortLabel: "Fed Tax Before Credits",
            calculate: (inputs) => {
                const { ordinary, ltcg } = calculateTaxableIncome(inputs, taxData, filingStatus);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const ordinaryTax = calculateOrdinaryTaxTotal(ordinary, brackets).tax;
                const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
                return ordinaryTax + ltcgTax;
            },
        },
        {
            id: "federalTaxCredits",
            label: "Federal Tax Credits",
            shortLabel: "Credits",
            sankeySettings: {
                node: { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)", row: 3, col: 2 },
                link: [
                    { source: "federalTaxCredits", target: "federalIncomeTax", fill: "var(--sankey-link-credits)", stroke: "var(--sankey-link-credits)", row: 3, col: 2 },
                ],
            },
            calculate: totalCredits,
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
