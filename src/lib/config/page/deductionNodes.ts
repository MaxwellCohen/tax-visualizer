// fallow-ignore-file code-duplication
/** Deduction-related config nodes: 0% tax brackets (standard/itemized), deduction amounts, mekko slices. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { ConfigItem } from "./pageConfig.types";
import { getCreditsSankeyRow } from "./sankeyLayout.helpers";
import {
    calculateTaxableIncome,
    calculatePayrollTax,
    calculatePayrollTaxBreakdown,
    calculateSelfEmploymentDeduction,
    computeFederalTaxCreditsApplied,
    getItemizedDeductionsWithoutPayrollTax,
    getStandardDeductionWithoutPayrollTax,
} from "./taxCalculations";
import { longTermCapGains, selfEmploymentIncome, allPretax } from "./pageConfig.inputs";

export function make0taxIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "standardDeduction",
            labels: { default: "0% tax", compact: "Standard Ded." },
            sankey: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 3, col: 3 },
                links: [
                    { source: "standardDeduction", target: "takeHomePay", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 3, col: 3 },
                ],
            },
            calculate: getStandardDeductionWithoutPayrollTax,
        },
        {
            id: "itemizedDeductions",
            labels: { default: "Itemized Deductions", compact: "Itemized Ded." },
            sankey: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 3, col: 3 },
                links: [
                    { source: "itemizedDeductions", target: "takeHomePay", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 3, col: 3 },
                ],
            },
            calculate: getItemizedDeductionsWithoutPayrollTax
        },
    ];
}

export function makeDeductionAmountNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        // {
        //     id: "taxableIncomeAfterDeductions",
        //     label: "Taxable Income After Deductions",
        //     shortLabel: "Taxable After Ded.",
        //     sankey: {
        //         node: { fill: "var(--sankey-node-3)", stroke: "var(--sankey-link)", row: 2, col: 2 },
        //     },
        //     calculate: taxableIncomeAfterDeductions,
        // },
        {
            id: "ordinaryTaxableIncome",
            labels: { default: "Ordinary Income", compact: "Ordinary (Pre-Ded)", summary: "Ordinary Taxable Income" },
            sankey: {
                node: { fill: "var(--sankey-node-3)", stroke: "var(--sankey-link)", row: 2, col: 2 },
            },
            summary: {
                summaryId: "ordinary-taxable-income",
                category: "income",
                displayOrder: 1.5,
                format: "currency",
            },
        },
        {
            id: "longTermTaxableIncome",
            labels: { default: "LTCG Taxable Income", compact: "LTCG Taxable", summary: "Long-Term Capital Gains" },
            sankey: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 3, col: 2 },
            },
            calculate: longTermCapGains,
            summary: {
                summaryId: "long-term-taxable-income",
                category: "income",
                displayOrder: 1.8,
                format: "currency",
            },
        },
        {
            id: "taxableIncome",
            labels: { default: "Total Taxable Income", compact: "Taxable Income", summary: "Taxable Income" },
            calculate: (inputs, taxData, filingStatus) => {
                const { total } = calculateTaxableIncome(inputs, taxData, filingStatus);
                return total;
            },
            summary: {
                summaryId: "taxable-income",
                category: "deduction",
                displayOrder: 3,
                format: "currency",
            },
        },
        // {
        //     id: "federalOrdinaryIncomeTax",
        //     label: "Federal Ordinary Tax",
        //     shortLabel: "Federal Ord. Tax",
        //     sankey: {
        //         node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 3, col: 1 },
        //     },
        //     calculate: (inputs, taxData, filingStatus) => {
        //         const { ordinary, payrollBracketShadowFill } = calculateTaxableIncome(inputs, taxData, filingStatus);
        //         const brackets = getOrdinaryBrackets(taxData, filingStatus);
        //         return calculateOrdinaryTaxWithPayrollShadow(ordinary, brackets, payrollBracketShadowFill).tax;
        //     },
        //     summary: {
        //         summaryId: "federal-ordinary-income-tax",
        //         label: "Ordinary Income Tax",
        //         category: "tax",
        //         displayOrder: 4.5,
        //         format: "currency",
        //     },
        // },
        // {
        //     id: "federalLongTermCapGainsTax",
        //     label: "Federal LTCG Tax",
        //     shortLabel: "Federal LTCG Tax",
        //     sankey: {
        //         node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 3, col: 1 },
        //     },
        //     calculate: (inputs, taxData, filingStatus) => {
        //         const { ordinary, ltcg } = calculateTaxableIncome(inputs, taxData, filingStatus);
        //         return calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
        //     },
        //     summary: {
        //         summaryId: "federal-ltcg-tax",
        //         label: "Capital Gains Tax",
        //         category: "tax",
        //         displayOrder: 4.7,
        //         format: "currency",
        //     },
        // },
        // {
        //     id: "federalNetInvestmentIncomeTax",
        //     label: "Net Investment Income Tax",
        //     shortLabel: "NIIT",
        //     sankey: {
        //         node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 3, col: 1 },
        //     },
        //     calculate: (inputs, taxData, filingStatus) => {
        //         const investmentIncome = ordinaryIncome(inputs) + shortTermCapGains(inputs) + longTermCapGains(inputs);
        //         const modifiedAGI = wageIncome(inputs) + selfEmploymentIncome(inputs) + investmentIncome;
        //         const threshold = taxData.niit.magiThreshold[filingStatus];
        //         if (modifiedAGI <= threshold) return 0;
        //         const niitBase = Math.max(0, investmentIncome - (modifiedAGI - threshold));
        //         return niitBase * taxData.niit.rate;
        //     },
        // },
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
            labels: { default: "Federal Credits Applied", compact: "Credits Applied" },
            sankey: {
                node: (() => {
                    const row = getCreditsSankeyRow(_taxData, _filingStatus);
                    return { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)", row, col: 3 };
                })(),
            },
            calculate: (inputs, taxData, filingStatus) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
            summary: {
                summaryId: "federal-tax-credits-applied",
                category: "credit",
                displayOrder: 5.5,
                format: "currency",
                hideWhenZero: true,
            },
        },
        {
            id: "socialSecurityTax",
            labels: { default: "Social Security Tax", compact: "SS Tax" },
            sankey: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
            },
            calculate: (inputs, td, filingStatus) => {
                return calculatePayrollTaxBreakdown(inputs, td, filingStatus).socialSecurityTax;
            },
        },
        {
            id: "medicareTax",
            labels: { default: "Medicare Tax", compact: "Medicare Tax" },
            sankey: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
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
            labels: { default: "Pre-tax deferrals", compact: "Pre-tax deferrals" },
            mekko: {
                row: {
                    row: 0,
                    col: 3,
                    fill: "var(--mekko-pretax)",
                    stroke: "var(--mekko-pretax)",
                    kind: "pretax",
                },
            },
            calculate: (inputs) => allPretax(inputs),
        },
        {
            id: "mekkoSelfEmploymentTaxDeduction",
            labels: { default: "½ self-employment tax (deductible)", compact: "½ SE tax" },
            mekko: {
                row: {
                    row: 1,
                    col: 3,
                    fill: "var(--mekko-pretax)",
                    stroke: "var(--mekko-pretax)",
                    kind: "seAdjustment",
                },
            },
            calculate: (inputs) => {
                const se = selfEmploymentIncome(inputs);
                return calculateSelfEmploymentDeduction(se, taxData);
            },
        },
        {
            id: "mekkoDeductionShieldNet",
            labels: { default: "Standard / itemized (shielded ordinary, net of payroll)", compact: "Deduction shield" },
            mekko: {
                row: {
                    row: 2,
                    col: 3,
                    fill: "var(--mekko-deduction)",
                    stroke: "var(--mekko-deduction)",
                    kind: "deduction",
                },
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
            labels: { default: "Payroll taxes (wage FICA)", compact: "Payroll taxes" },
            mekko: {
                row: {
                    row: 3,
                    col: 3,
                    fill: "var(--mekko-tax)",
                    stroke: "var(--mekko-tax)",
                    kind: "payrollTax",
                },
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