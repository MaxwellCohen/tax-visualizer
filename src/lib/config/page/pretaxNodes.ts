/** Pretax-related config nodes: pretax income, pretax deductions, pretax takehome. */
/** Pretax-related config nodes: pretax income, pretax deductions, pretax takehome. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    wageIncome,
    _401k,
    _hsa,
    otherPretax,
    traditionalIra,
    allPretax,
    ordinaryIncome,
    shortTermCapGains,
} from "./pageConfig.inputs";

export function makePretaxIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "pretaxIncome",
            label: "Pretax income 0% tax",
            shortLabel: "Pretax income 0% tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
                link: [
                    { source: "pretaxIncome", target: "pretaxTakehome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
                ],
            },
        },
        {
            id: "pretaxTakehome",
            label: "Pretax take-home",
            shortLabel: "Pretax take-home",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 4 },
                link: [
                    { source: "pretaxTakehome", target: "takeHomePay", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 4 },
                ],
            },
        },
    ];
}

export function makePretaxDeductionsNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "ordinaryGrossIncome",
            label: "Ordinary Gross Income",
            shortLabel: "Ordinary Gross",
            calculate: (inputs) => ordinaryIncome(inputs) + shortTermCapGains(inputs),
        },
        {
            id: "preTaxTotal",
            label: "Total Pre-tax",
            shortLabel: "Total Pre-tax",
            calculate: (inputs) => _401k(inputs) + _hsa(inputs) + otherPretax(inputs),
        },
        {
            id: "preTax401k",
            label: "401(k)",
            shortLabel: "401(k)",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: _401k,
        },
        {
            id: "preTaxHsa",
            label: "HSA",
            shortLabel: "HSA",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: _hsa,
        },
        {
            id: "preTaxOther",
            label: "Other Pre-tax",
            shortLabel: "Other Pre-tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: otherPretax,
        },
        {
            id: "traditionalIra",
            label: "Traditional IRA",
            shortLabel: "Traditional IRA",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: traditionalIra,
        },
        {
            id: "wagesAfterPretax",
            label: "Wages After Pre-tax",
            shortLabel: "Wages After Pre-tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 1, col: 3 },
            },
            calculate: (inputs) => wageIncome(inputs) - allPretax(inputs),
        },
    ];
}