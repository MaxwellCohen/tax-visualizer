/** Pretax-related config nodes: pretax income, pretax deductions, pretax takehome. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import {
    wageIncome,
    _401k,
    _hsa,
    otherPretax,
    traditionalIra,
    allPretax,
    ordinaryIncome,
    shortTermCapGains,
} from "../rowMetrics";

export function makePretaxIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "pretaxIncome",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "Pretax income 0% tax", compact: "Pretax income 0% tax" },
            description: "Income sheltered from federal income tax via payroll elections (deferrals, HSA, etc.)",
            sankey: {
                node: { row: 1, col: 3 },
                links: [
                    { source: "pretaxIncome", target: "pretaxTakehome", row: 1, col: 3 },
                ],
            },
        },
        {
            id: "pretaxTakehome",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "Pretax take-home", compact: "Pretax take-home" },
            description: "Take-home cash backed by pre-tax income (e.g. employer HSA pass-through)",
            sankey: {
                node: { row: 1, col: 4 },
                links: [
                    { source: "pretaxTakehome", target: "takeHomePay", row: 1, col: 4 },
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
            description: "Ordinary income plus short-term capital gains (internal gross)",
            calculate: (inputs) => ordinaryIncome(inputs) + shortTermCapGains(inputs),
        },
        {
            id: "preTaxTotal",
            labels: { default: "Total Pre-tax", compact: "Total Pre-tax" },
            description: "Payroll pre-tax only: 401(k)/403(b)/457(b), HSA, FSAs, commuter, and similar",
            calculate: (inputs) => _401k(inputs) + _hsa(inputs) + otherPretax(inputs),
        },
        {
            id: "preTax401k",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "401(k) / 403(b) / 457(b)", compact: "401(k)" },
            description: "Combined elective deferrals (401(k), 403(b), and 457(b)) per modeled limits",
            sankey: {
                node: { row: 1, col: 3 },
            },
            calculate: _401k,
        },
        {
            id: "preTaxHsa",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "HSA", compact: "HSA" },
            description: "Payroll HSA contributions toward HDHP limits",
            sankey: {
                node: { row: 1, col: 3 },
            },
            calculate: _hsa,
        },
        {
            id: "preTaxOther",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "Other Pre-tax", compact: "Other Pre-tax" },
            description: "Miscellaneous payroll pre-tax (FSA, dependent care, commuter, etc.)",
            sankey: {
                node: { row: 1, col: 3 },
            },
            calculate: otherPretax,
        },
        {
            id: "traditionalIra",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "Traditional IRA", compact: "Traditional IRA" },
            description: "Deductible IRA funded outside payroll (shown with deferrals for chart flow)",
            sankey: {
                node: { row: 1, col: 3 },
            },
            calculate: traditionalIra,
        },
        {
            id: "wagesAfterPretax",
            chartStyle: { fill: "var(--color-chart-income)", stroke: "var(--color-sankey-link)" },
            labels: { default: "Wages After Pre-tax", compact: "Wages After Pre-tax" },
            description: "Wages minus modeled pre-tax amounts (deferrals, HSA, other payroll pre-tax, deductible IRA — capped at wages)",
            sankey: {
                node: { row: 1, col: 3 },
            },
            calculate: (inputs) => wageIncome(inputs) - allPretax(inputs),
        },
    ];
}