/** Income pipeline: wages, pretax, shielded income, taxable ordinary/LTCG, and related calculated nodes. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { ConfigItem } from "./pageConfig.types";
import {
    selfEmploymentIncome,
    shortTermCapGains,
    longTermCapGains,
    ordinaryIncome,
    allPretax,
    totalIncome,
} from "./pageConfig.inputs";
import { ordinaryIncomeAfterPretax } from "./taxCalculations";

export function makeIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "totalIncome",
            chartRole: "income",
            labels: { default: "Total Income", compact: "Total Income", summary: "Gross Income" },
            calculate: totalIncome,
            summary: {
                displayOrder: 1,
                format: "currency",
            },
        },
        {
            id: "wages",
            chartStyle: { fill: "var(--chart-income)", stroke: "var(--sankey-link)" },
            labels: { default: "Wages" },
            sankey: {
                node: { row: 1, col: 1 },
                links: [
                    { source: "wages", target: "ordinaryTaxableIncome", row: 1, col: 1 },
                ],
            },
            calculate: ordinaryIncomeAfterPretax,
        },
        {
            id: "longTermCapGains",
            chartStyle: { fill: "var(--chart-ltcg)", stroke: "var(--sankey-link)" },
            labels: { default: "Long-Term Capital Gains" },
            sankey: {
                node: { row: 2, col: 1 },
                links: [
                    { source: "longTermCapGains", target: "longTermTaxableIncome", row: 1, col: 1 },
                ],
            },
            calculate: longTermCapGains,
        },
        {
            id: "pretaxDeductions",
            chartRole: "pretax",
            chartStyle: { fill: "var(--chart-pretax)", stroke: "var(--sankey-link-deferred)" },
            labels: { default: "Pretax Deductions", compact: "Pretax Deductions", summary: "Pre-tax Deductions" },
            sankey: {
                node: { row: 1, col: 2 },
                links: [
                    { source: "pretaxDeductions", target: "pretaxIncome", row: 1, col: 2 },
                    { source: "pretaxIncome", target: "pretaxTakehome", row: 1, col: 3 },
                ],
            },
            calculate: allPretax,
            summary: {
                displayOrder: 2,
                format: "currency",
            },
        },
        {
            id: "selfEmployment",
            labels: { default: "Self-Employment Income" },
            calculate: selfEmploymentIncome,
        },
        {
            id: "ordinaryIncome",
            labels: { default: "Other Ordinary Income" },
            calculate: ordinaryIncome,
        },
        {
            id: "shortTermCapGains",
            labels: { default: "Short-Term Capital Gains" },
            calculate: shortTermCapGains,
        },
        {
            id: "shortTermCapGainsGrossIncome",
            labels: { default: "Short-Term Cap Gains (Gross)", compact: "STCG (Gross)" },
            calculate: shortTermCapGains,
        },
        {
            id: "longTermCapitalGainsGrossIncome",
            chartStyle: { fill: "var(--chart-ltcg)", stroke: "var(--sankey-link)" },
            labels: { default: "Long-Term Cap Gains (Gross)", compact: "LTCG (Gross)" },
            sankey: {
                node: { row: 1, col: 2 },
            },
            calculate: longTermCapGains,
        },
    ]
}