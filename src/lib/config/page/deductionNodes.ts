/** Deduction-related config nodes: 0% tax brackets (standard/itemized), deduction amounts, mekko slices. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { getItemizedDeductionsWithoutPayrollTax, getStandardDeductionWithoutPayrollTax, getCreditsSankeyRow, getOrdinaryBrackets, calculateLtcgTaxTotal } from "./pageConfig.helpers";
import {
    calculateTaxableIncome,
    calculatePayrollTax,
    calculateSelfEmploymentDeduction,
    calculateOrdinaryTaxWithPayrollShadow,
    computeFederalTaxCreditsApplied,
} from "./taxCalculations";
import { longTermCapGains, ordinaryIncome, shortTermCapGains, selfEmploymentIncome, wageIncome, allPretax } from "./pageConfig.inputs";

export function make0taxIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "standardDeduction",
            label: "0% tax",
            shortLabel: "Standard Ded.",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 3, col: 3 },
                link: [
                    { source: "standardDeduction", target: "takeHomePay", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 3, col: 3 },
                ],
            },
            calculate: getStandardDeductionWithoutPayrollTax,
        },
        {
            id: "itemizedDeductions",
            label: "Itemized Deductions",
            shortLabel: "Itemized Ded.",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 3, col: 3 },
                link: [
                    { source: "itemizedDeductions", target: "takeHomePay", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 3, col: 3 },
                ],
            },
            calculate: getItemizedDeductionsWithoutPayrollTax
        },
    ];
}

export function makeDeductionAmountNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "taxableIncomeAfterDeductions",
            label: "Taxable Income After Deductions",
            shortLabel: "Taxable After Ded.",
            sankeySettings: {
                node: { fill: "var(--sankey-node-3)", stroke: "var(--sankey-link)", row: 2, col: 2 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const { ordinary } = calculateTaxableIncome(inputs, taxData, filingStatus);
                return ordinary;
            },
        },
        {
            id: "ordinaryTaxableIncome",
            label: "Ordinary Income",
            shortLabel: "Ordinary (Pre-Ded)",
            sankeySettings: {
                node: { fill: "var(--sankey-node-3)", stroke: "var(--sankey-link)", row: 2, col: 2 },
            },
            summary: {
                summaryId: "ordinary-taxable-income",
                label: "Ordinary Taxable Income",
                category: "income",
                displayOrder: 1.5,
                format: "currency",
            },
        },
        {
            id: "longTermTaxableIncome",
            label: "LTCG Taxable Income",
            shortLabel: "LTCG Taxable",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 3, col: 2 },
            },
            calculate: longTermCapGains,
            summary: {
                summaryId: "long-term-taxable-income",
                label: "Long-Term Capital Gains",
                category: "income",
                displayOrder: 1.8,
                format: "currency",
            },
        },
        {
            id: "taxableIncome",
            label: "Total Taxable Income",
            shortLabel: "Taxable Income",
            calculate: (inputs, taxData, filingStatus) => {
                const { total } = calculateTaxableIncome(inputs, taxData, filingStatus);
                return total;
            },
            summary: {
                summaryId: "taxable-income",
                label: "Taxable Income",
                category: "deduction",
                displayOrder: 3,
                format: "currency",
            },
        },
        {
            id: "federalOrdinaryIncomeTax",
            label: "Federal Ordinary Tax",
            shortLabel: "Federal Ord. Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 3, col: 1 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const { ordinary, payrollBracketShadowFill } = calculateTaxableIncome(inputs, taxData, filingStatus);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                return calculateOrdinaryTaxWithPayrollShadow(ordinary, brackets, payrollBracketShadowFill).tax;
            },
            summary: {
                summaryId: "federal-ordinary-income-tax",
                label: "Ordinary Income Tax",
                category: "tax",
                displayOrder: 4.5,
                format: "currency",
            },
        },
        {
            id: "federalLongTermCapGainsTax",
            label: "Federal LTCG Tax",
            shortLabel: "Federal LTCG Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 3, col: 1 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const { ordinary, ltcg } = calculateTaxableIncome(inputs, taxData, filingStatus);
                return calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
            },
            summary: {
                summaryId: "federal-ltcg-tax",
                label: "Capital Gains Tax",
                category: "tax",
                displayOrder: 4.7,
                format: "currency",
            },
        },
        {
            id: "federalNetInvestmentIncomeTax",
            label: "Net Investment Income Tax",
            shortLabel: "NIIT",
            sankeySettings: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 3, col: 1 },
            },
            calculate: (inputs, taxData, filingStatus) => {
                const investmentIncome = ordinaryIncome(inputs) + shortTermCapGains(inputs) + longTermCapGains(inputs);
                const modifiedAGI = wageIncome(inputs) + selfEmploymentIncome(inputs) + investmentIncome;
                const threshold = taxData.niit.magiThreshold[filingStatus];
                if (modifiedAGI <= threshold) return 0;
                const niitBase = Math.max(0, investmentIncome - (modifiedAGI - threshold));
                return niitBase * taxData.niit.rate;
            },
        },
        {
            id: "netInvestmentIncome",
            label: "Net Investment Income",
            shortLabel: "Investment Income",
            calculate: (inputs) => {
                return ordinaryIncome(inputs) + shortTermCapGains(inputs) + longTermCapGains(inputs);
            },
        },
        {
            id: "federalTaxCreditsApplied",
            label: "Federal Credits Applied",
            shortLabel: "Credits Applied",
            sankeySettings: {
                node: (() => {
                    const row = getCreditsSankeyRow(_taxData, _filingStatus);
                    return { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)", row, col: 3 };
                })(),
            },
            calculate: (inputs, taxData, filingStatus) => computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
        },
        {
            id: "socialSecurityTax",
            label: "Social Security Tax",
            shortLabel: "SS Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
            },
            calculate: (inputs, td) => {
                const wages = wageIncome(inputs);
                const ssTaxable = Math.min(wages, td.payroll.socialSecurityWageBase);
                return ssTaxable * td.payroll.socialSecurityRate;
            },
        },
        {
            id: "medicareTax",
            label: "Medicare Tax",
            shortLabel: "Medicare Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
            },
            calculate: (inputs, td) => {
                const wages = wageIncome(inputs);
                return wages * td.payroll.medicareRate;
            },
        },
    ];
}

/** Mekko vertical slices before federal brackets: deferrals, SE adjustment, deduction shield. */
export function makeMekkoSliceNodesConfig(taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "mekkoPretaxDeferrals",
            label: "Pre-tax deferrals",
            shortLabel: "Pre-tax deferrals",
            mekkoSettings: {
                column: {
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
            label: "½ self-employment tax (deductible)",
            shortLabel: "½ SE tax",
            mekkoSettings: {
                column: {
                    row: 0,
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
            label: "Standard / itemized (shielded ordinary, net of payroll)",
            shortLabel: "Deduction shield",
            mekkoSettings: {
                column: {
                    row: 0,
                    col: 3,
                    fill: "var(--mekko-deduction)",
                    stroke: "var(--mekko-deduction)",
                    kind: "deduction",
                },
            },
            calculate: (inputs, td, fs) => {
                const t = calculateTaxableIncome(inputs, td, fs);
                const shield = Math.max(0, t.afterPretax - t.ordinary);
                const payrollTax = calculatePayrollTax(inputs, td);
                const payrollFromShield = Math.min(payrollTax, shield);
                return Math.max(0, shield - payrollFromShield);
            },
        },
        {
            id: "mekkoPayrollTaxFromShield",
            label: "Payroll taxes (wage FICA)",
            shortLabel: "Payroll taxes",
            mekkoSettings: {
                column: {
                    row: 0,
                    col: 3,
                    fill: "var(--mekko-tax)",
                    stroke: "var(--mekko-tax)",
                    kind: "payrollTax",
                },
            },
            calculate: (inputs, td, fs) => {
                const t = calculateTaxableIncome(inputs, td, fs);
                const shield = Math.max(0, t.afterPretax - t.ordinary);
                const payrollTax = calculatePayrollTax(inputs, td);
                return Math.min(payrollTax, shield);
            },
        },
    ];
}