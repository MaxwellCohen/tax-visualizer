/** Income pipeline: wages, pretax, shielded income, taxable ordinary/LTCG, and related calculated nodes. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    calculateLtcgTaxTotal,
    calculateOrdinaryTaxTotal,
    getCreditsSankeyRow,
    getOrdinaryBrackets,
    getItemizedDeductions,
    getStandardDeduction,
} from "./pageConfig.helpers";
import {
    calculateTaxableIncome,
    computeFederalTaxCreditsApplied,
} from "./taxCalculations";
import {
    wageIncome,
    selfEmploymentIncome,
    shortTermCapGains,
    longTermCapGains,
    ordinaryIncome,
    _401k,
    _hsa,
    otherPretax,
    traditionalIra,
    useItemizedDeductions,
    totalItemized,
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

        }]
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

export function make0taxIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "standardDeduction",
            label: "0% tax (standard deduction)",
            shortLabel: "Standard Ded.",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 3, col: 3 },
                link: [
                    { source: "standardDeduction", target: "takeHomePay", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 3, col: 3 },
                ],
            },
            calculate: (inputs, taxData, filingStatus) => {
                return getStandardDeduction(inputs, taxData, filingStatus);
            },
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
            calculate: getItemizedDeductions
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
        },
        {
            id: "longTermTaxableIncome",
            label: "LTCG Taxable Income",
            shortLabel: "LTCG Taxable",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 3, col: 2 },
            },
            calculate: longTermCapGains,
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
                const { ordinary } = calculateTaxableIncome(inputs, taxData, filingStatus);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                return calculateOrdinaryTaxTotal(ordinary, brackets).tax;
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
        },
        {
            id: "federalNetInvestmentIncomeTax",
            label: "Net Investment Income Tax",
            shortLabel: "NIIT",
            sankeySettings: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 3, col: 1 },
            },
            calculate: (inputs, _taxData, filingStatus) => {
                const investmentIncome = ordinaryIncome(inputs) + shortTermCapGains(inputs) + longTermCapGains(inputs);
                const modifiedAGI = wageIncome(inputs) + selfEmploymentIncome(inputs) + investmentIncome;
                const threshold = filingStatus === "marriedJoint" ? 250000 : 200000;
                if (modifiedAGI <= threshold) return 0;
                const niitBase = Math.max(0, investmentIncome - (modifiedAGI - threshold));
                return niitBase * 0.038;
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
            calculate: (inputs, taxData, filingStatus) =>
                computeFederalTaxCreditsApplied(inputs, taxData, filingStatus),
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
