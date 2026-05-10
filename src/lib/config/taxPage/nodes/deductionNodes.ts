// fallow-ignore-file code-duplication
/** Deduction-related config nodes: 0% tax brackets (standard/itemized), deduction amounts, mekko slices. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import {
    calculateTaxableIncome,
    calculatePayrollTax,
    calculatePayrollTaxBreakdown,
    calculateSelfEmploymentDeduction,
    computeFederalTaxCreditsApplied,
    getItemizedDeductionsWithoutPayrollTax,
    getStandardDeductionWithoutPayrollTax,
} from "../calc/taxCalculations";
import { longTermCapGains, selfEmploymentIncome, allPretax } from "../rowMetrics";

export function make0taxIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "standardDeduction",
            chartStyle: { fill: "var(--color-chart-deduction-node)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: "0% tax", compact: "Standard Ded." },
            sankey: {
                node: { row: 3, col: 3 },
                links: [
                    { source: "standardDeduction", target: "takeHomePay", row: 3, col: 3 },
                ],
            },
            calculate: getStandardDeductionWithoutPayrollTax,
        },
        {
            id: "itemizedDeductions",
            chartStyle: { fill: "var(--color-chart-deduction-node)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: "Itemized Deductions", compact: "Itemized Ded." },
            sankey: {
                node: { row: 3, col: 3 },
                links: [
                    { source: "itemizedDeductions", target: "takeHomePay", row: 3, col: 3 },
                ],
            },
            calculate: getItemizedDeductionsWithoutPayrollTax
        },
    ];
}

export function makeDeductionAmountNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "ordinaryTaxableIncome",
            chartRole: "income",
            chartStyle: { fill: "var(--color-sankey-node-3)", stroke: "var(--color-sankey-link)" },
            labels: { default: "Ordinary Income", compact: "Ordinary (Pre-Ded)", summary: "Ordinary Taxable Income" },
            sankey: {
                node: { row: 2, col: 2 },
            },
            summary: {
                displayOrder: 1.5,
                format: "currency",
            },
        },
        {
            id: "longTermTaxableIncome",
            chartRole: "income",
            chartStyle: { fill: "var(--color-chart-ltcg)", stroke: "var(--color-sankey-link)" },
            labels: { default: "LTCG Taxable Income", compact: "LTCG Taxable", summary: "Long-Term Capital Gains" },
            sankey: {
                node: { row: 3, col: 2 },
            },
            calculate: longTermCapGains,
            summary: {
                displayOrder: 1.8,
                format: "currency",
            },
        },
        {
            id: "taxableIncome",
            chartRole: "deduction",
            labels: { default: "Total Taxable Income", compact: "Taxable Income", summary: "Taxable Income" },
            calculate: (inputs, taxData, filingStatus) => {
                const { total } = calculateTaxableIncome(inputs, taxData, filingStatus);
                return total;
            },
            summary: {
                displayOrder: 3,
                format: "currency",
            },
        },
        // {
        //     id: "netInvestmentIncome",
        //     label: "Net Investment Income",
        //     shortLabel: "Investment Income",
        //     calculate: (inputs) => {
        //         return ordinaryIncome(inputs) + shortTermCapGains(inputs) + longTermCapGains(inputs);
        //     },
        // },
        {
            id: "federalTaxCreditsApplied",
            chartRole: "credit",
            chartStyle: { fill: "var(--color-chart-credit)", stroke: "var(--color-sankey-link-credits)" },
            labels: { default: "Federal Credits Applied", compact: "Credits Applied" },
            calculate: (inputs, taxData, filingStatus) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
            summary: {
                displayOrder: 5.5,
                format: "currency",
                hideWhenZero: true,
            },
        },
        {
            id: "socialSecurityTax",
            chartStyle: { fill: "var(--color-sankey-node-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Social Security Tax", compact: "SS Tax" },
            sankey: {
                node: { row: 4, col: 1 },
            },
            calculate: (inputs, td, filingStatus) => {
                return calculatePayrollTaxBreakdown(inputs, td, filingStatus).socialSecurityTax;
            },
        },
        {
            id: "medicareTax",
            chartStyle: { fill: "var(--color-sankey-node-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: "Medicare Tax", compact: "Medicare Tax" },
            sankey: {
                node: { row: 4, col: 1 },
            },
            calculate: (inputs, td, filingStatus) => {
                return calculatePayrollTaxBreakdown(inputs, td, filingStatus).medicareTax;
            },
        },
    ];
}

/** Mekko vertical slices before federal brackets: deferrals, SE adjustment, deduction shield. */
export function makeMekkoSliceNodesConfig(taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "mekkoPretaxDeferrals",
            chartRole: "pretax",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-chart-pretax)" },
            labels: { default: "Pre-tax deferrals", compact: "Pre-tax deferrals" },
            mekko: {
                    row: 0,
            },
            calculate: (inputs) => allPretax(inputs),
        },
        {
            id: "mekkoSelfEmploymentTaxDeduction",
            chartRole: "seAdjustment",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-chart-pretax)" },
            labels: { default: "½ self-employment tax (deductible)", compact: "½ SE tax" },
            mekko: {
                
                    row: 2,
                
            },
            calculate: (inputs) => {
                const se = selfEmploymentIncome(inputs);
                return calculateSelfEmploymentDeduction(se, taxData);
            },
        },
        {
            id: "mekkoDeductionShieldNet",
            chartRole: "deduction",
            chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: "Standard / itemized (shielded ordinary, net of payroll)", compact: "Deduction shield" },
            mekko: {
                    row: 3,
            
            },
            calculate: (inputs, td, fs) => {
                const t = calculateTaxableIncome(inputs, td, fs);
                const shield = Math.max(0, t.afterPretax - t.ordinary);
                const payrollTax = calculatePayrollTax(inputs, td, fs);
                const payrollFromShield = Math.min(payrollTax, shield);
                return Math.max(0, shield - payrollFromShield);
            },
        },
        {
            id: "mekkoPayrollTaxFromShield",
            chartRole: "payrollTax",
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-chart-tax)" },
            labels: { default: "Payroll taxes (wage FICA)", compact: "Payroll taxes" },
            mekko: {
                    row: 1,
            },
            calculate: (inputs, td, fs) => {
                const t = calculateTaxableIncome(inputs, td, fs);
                const shield = Math.max(0, t.afterPretax - t.ordinary);
                const payrollTax = calculatePayrollTax(inputs, td, fs);
                return Math.min(payrollTax, shield);
            },
        },
    ];
}