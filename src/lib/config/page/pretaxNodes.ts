/** Pretax-related config nodes: pretax income, pretax deductions, pretax takehome. */
/** Pretax-related config nodes: pretax income, pretax deductions, pretax takehome. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { ConfigItem } from "./pageConfig.types";
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

export function makePretaxIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "pretaxIncome",
            labels: { default: "Pretax income 0% tax", compact: "Pretax income 0% tax" },
            sankey: {
                node: { fill: "var(--chart-pretax)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
                links: [
                    { source: "pretaxIncome", target: "pretaxTakehome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
                ],
            },
        },
        {
            id: "pretaxTakehome",
            labels: { default: "Pretax take-home", compact: "Pretax take-home" },
            sankey: {
                node: { fill: "var(--chart-pretax)", stroke: "var(--sankey-link-deferred)", row: 1, col: 4 },
                links: [
                    { source: "pretaxTakehome", target: "takeHomePay", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 4 },
                ],
            },
        },
    ];
}

export function makePretaxDeductionsNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "ordinaryGrossIncome",
            labels: { default: "Ordinary Gross Income", compact: "Ordinary Gross" },
            calculate: (inputs) => ordinaryIncome(inputs) + shortTermCapGains(inputs),
        },
        {
            id: "preTaxTotal",
            labels: { default: "Total Pre-tax", compact: "Total Pre-tax" },
            calculate: (inputs) => _401k(inputs) + _hsa(inputs) + otherPretax(inputs),
        },
        {
            id: "preTax401k",
            labels: { default: "401(k)", compact: "401(k)" },
            sankey: {
                node: { fill: "var(--chart-pretax)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: _401k,
        },
        {
            id: "preTaxHsa",
            labels: { default: "HSA", compact: "HSA" },
            sankey: {
                node: { fill: "var(--chart-pretax)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: _hsa,
        },
        {
            id: "preTaxOther",
            labels: { default: "Other Pre-tax", compact: "Other Pre-tax" },
            sankey: {
                node: { fill: "var(--chart-pretax)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: otherPretax,
        },
        {
            id: "traditionalIra",
            labels: { default: "Traditional IRA", compact: "Traditional IRA" },
            sankey: {
                node: { fill: "var(--chart-pretax)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: traditionalIra,
        },
        {
            id: "wagesAfterPretax",
            labels: { default: "Wages After Pre-tax", compact: "Wages After Pre-tax" },
            sankey: {
                node: { fill: "var(--chart-income)", stroke: "var(--sankey-link)", row: 1, col: 3 },
            },
            calculate: (inputs) => wageIncome(inputs) - allPretax(inputs),
        },
    ];
}