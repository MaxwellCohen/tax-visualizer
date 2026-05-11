// fallow-ignore-file code-duplication
/** Deduction-related config nodes: 0% tax brackets (standard/itemized), deduction amounts, mekko slices. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import {
    calculatePayrollTax,
    calculatePayrollTaxBreakdown,
    calculateSelfEmploymentDeduction,
    computeFederalTaxCreditsApplied,
    getItemizedDeductionsWithoutPayrollTax,
    getStandardDeductionWithoutPayrollTax,
    totalTaxableIncome,
    ordinaryIncomeAfterPretax,
    taxableIncomeAfterDeductions,
} from "../calc/taxCalculations";
import { longTermCapGains, allPretax } from "../rowMetrics";

export function make0taxIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "standardDeduction",
            chartStyle: { fill: "var(--color-chart-deduction-node)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: "0% tax", compact: "Standard Ded." },
            description: "Standard deduction slice taxed at 0% federal ordinary rates",
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
            description: "Itemized deduction slice taxed at 0% federal ordinary rates",
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
            description: "Ordinary income stack before standard vs itemized deduction",
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
            description: "Long-term gains flowing to preferential LTCG brackets",
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
            description: "Federal taxable income after deductions (ordinary + LTCG pipeline)",
            calculate: totalTaxableIncome,
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
            description: "Sum of federal credits applied against income tax in this model",
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
            description: "Employee Social Security (OASDI) on wages up to the wage base",
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
            description: "Employee Medicare tax on wages (including additional Medicare when modeled)",
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
export function makeMekkoSliceNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "mekkoPretaxDeferrals",
            chartRole: "pretax",
            chartStyle: { fill: "var(--color-chart-pretax)", stroke: "var(--color-chart-pretax)" },
            labels: { default: "Pre-tax deferrals", compact: "Pre-tax deferrals" },
            description: "Total payroll pre-tax deferrals in the Mekko income split",
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
            description: "Deductible half of self-employment tax (above-the-line)",
            mekko: {
                
                    row: 2,
                
            },
            calculate: (inputs) => calculateSelfEmploymentDeduction(inputs, taxData, filingStatus),
        },
        {
            id: "mekkoDeductionShieldNet",
            chartRole: "deduction",
            chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: "Standard / itemized (shielded ordinary, net of payroll)", compact: "Deduction shield" },
            description: "Standard or itemized deduction shield on ordinary income after payroll offset",
            mekko: {
                    row: 3,
            
            },
            calculate: (inputs, td, fs) => {
                const ordinary = taxableIncomeAfterDeductions(inputs, td, fs);
                const afterPretax = ordinaryIncomeAfterPretax(inputs);
                const shield = Math.max(0, afterPretax - ordinary);
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
            description: "Wage payroll taxes attributed to the deduction-shield slice",
            mekko: {
                    row: 1,
            },
            calculate: (inputs, td, fs) => {
                const  ordinary = taxableIncomeAfterDeductions(inputs, td, fs);
                const afterPretax = ordinaryIncomeAfterPretax(inputs);
                const shield = Math.max(0, afterPretax - ordinary);
                const payrollTax = calculatePayrollTax(inputs, td, fs);
                return Math.min(payrollTax, shield);
            },
        },
    ];
}