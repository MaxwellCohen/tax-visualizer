/** Income pipeline: wages, pretax, shielded income, taxable ordinary/LTCG, and related calculated nodes. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";

export function makeIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "totalIncome",
            chartRole: "income",
            labels: { default: "Total Income", compact: "Total Income", summary: "Gross Income" },
            description: "Sum of modeled wages, other ordinary income, and capital gains",
            calculate: (_inputs, _taxData, _filingStatus, context) => context.metrics.income.total,
            summary: {
                displayOrder: 1,
                format: "currency",
            },
        },
        {
            id: "wages",
            chartStyle: { fill: "var(--color-chart-income)", stroke: "var(--color-sankey-link)" },
            labels: { default: "Wages" },
            description: "Taxable wages after payroll pre-tax reductions",
            sankey: {
                node: { row: 1, col: 1 },
                links: [
                    { source: "wages", target: "ordinaryTaxableIncome", row: 1, col: 1 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => context.ordinaryIncomeAfterPretax,
        },
        {
            id: "longTermCapGains",
            chartStyle: { fill: "var(--color-chart-ltcg)", stroke: "var(--color-sankey-link)" },
            labels: { default: "Long-Term Capital Gains" },
            description: "Long-term capital gains eligible for LTCG rates",
            sankey: {
                node: { row: 2, col: 1 },
                links: [
                    { source: "longTermCapGains", target: "longTermTaxableIncome", row: 1, col: 1 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => context.metrics.income.longTermCapGains,
        },
        {
            id: "pretaxDeductions",
            chartRole: "pretax",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-sankey-link-deferred)" },
            labels: { default: "Pretax Deductions", compact: "Pretax Deductions", summary: "Pre-tax Deductions" },
            description: "Payroll pre-tax plus deductible IRA — flows off top of wages",
            sankey: {
                node: { row: 1, col: 2 },
                links: [
                    { source: "pretaxDeductions", target: "pretaxIncome", row: 1, col: 2 },
                    { source: "pretaxIncome", target: "pretaxTakehome", row: 1, col: 3 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => context.metrics.pretax.all,
            summary: {
                displayOrder: 2,
                format: "currency",
            },
        },
        {
            id: "selfEmployment",
            labels: { default: "Self-Employment Income" },
            description: "Net self-employment earnings (Schedule SE basis)",
            calculate: (_inputs, _taxData, _filingStatus, context) => context.metrics.income.selfEmployment,
        },
        {
            id: "ordinaryIncome",
            labels: { default: "Other Ordinary Income" },
            description: "Ordinary income other than wages (interest, ordinary dividends, etc.)",
            calculate: (_inputs, _taxData, _filingStatus, context) => context.metrics.income.ordinary,
        },
        {
            id: "shortTermCapGains",
            labels: { default: "Short-Term Capital Gains" },
            description: "Short-term capital gains taxed as ordinary income",
            calculate: (_inputs, _taxData, _filingStatus, context) => context.metrics.income.shortTermCapGains,
        },
        {
            id: "shortTermCapGainsGrossIncome",
            labels: { default: "Short-Term Cap Gains (Gross)", compact: "STCG (Gross)" },
            description: "STCG included in gross ordinary-income style totals",
            calculate: (_inputs, _taxData, _filingStatus, context) => context.metrics.income.shortTermCapGains,
        },
        {
            id: "longTermCapitalGainsGrossIncome",
            chartStyle: { fill: "var(--color-chart-ltcg)", stroke: "var(--color-sankey-link)" },
            labels: { default: "Long-Term Cap Gains (Gross)", compact: "LTCG (Gross)" },
            description: "LTCG before stacking / preferential-rate split",
            sankey: {
                node: { row: 1, col: 2 },
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => context.metrics.income.longTermCapGains,
        },
    ]
}