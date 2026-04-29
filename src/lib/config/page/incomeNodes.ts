/** Income pipeline: wages, pretax, shielded income, taxable ordinary/LTCG, and related calculated nodes. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    wageIncome,
    selfEmploymentIncome,
    shortTermCapGains,
    longTermCapGains,
    ordinaryIncome,
    allPretax,
    totalIncome,
} from "./pageConfig.inputs";

export function makeIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "totalIncome",
            label: "Total Income",
            shortLabel: "Total Income",
            calculate: totalIncome,
            summary: {
                summaryId: "total-income",
                label: "Gross Income",
                category: "income",
                displayOrder: 1,
                format: "currency",
            },
        },
        {
            id: "wages",
            label: "Wages",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 1, col: 1 },
                link: [
                    { source: "wages", target: "ordinaryTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 1 },
                ],
            },
            calculate: (inputs) => {
                return wageIncome(inputs) - allPretax(inputs);
            },
        },
        {
            id: "longTermCapGains",
            label: "Long-Term Capital Gains",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "longTermCapGains", target: "longTermTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 1 },
                ],
            },
            calculate: longTermCapGains,
        },
        {
            id: "pretaxDeductions",
            label: "Pretax Deductions",
            shortLabel: "Pretax Deductions",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 2 },
                link: [
                    { source: "pretaxDeductions", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 2 },
                    { source: "pretaxIncome", target: "pretaxTakehome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
                ],
            },
            calculate: (inputs) => {
                const pretax = allPretax(inputs);
                return pretax;
            },
            summary: {
                summaryId: "pretax-deductions",
                label: "Pre-tax Deductions",
                category: "pretax",
                displayOrder: 2,
                format: "currency",
            },
        },
        {
            id: "selfEmployment",
            label: "Self-Employment Income",
            calculate: selfEmploymentIncome,
        },
        {
            id: "ordinaryIncome",
            label: "Other Ordinary Income",
            calculate: ordinaryIncome,
        },
        {
            id: "shortTermCapGains",
            label: "Short-Term Capital Gains",
            calculate: shortTermCapGains,
        },
        {
            id: "shortTermCapGainsGrossIncome",
            label: "Short-Term Cap Gains (Gross)",
            shortLabel: "STCG (Gross)",
            calculate: shortTermCapGains,
        },
        {
            id: "longTermCapitalGainsGrossIncome",
            label: "Long-Term Cap Gains (Gross)",
            shortLabel: "LTCG (Gross)",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 1, col: 2 },
            },
            calculate: longTermCapGains,
        },
    ]
}