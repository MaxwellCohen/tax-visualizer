/** Income pipeline: wages, pretax, shielded income, taxable ordinary/LTCG, and related calculated nodes. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    calculateLtcgTaxTotal,
    calculateOrdinaryTaxTotal,
    findInputById,
    getOrdinaryBrackets,
    getStandardDeduction,
} from "./pageConfig.helpers";
import { calculatePayrollTax } from "~/lib/config/page/pageConfig.finalTaxContext";
import { wageIncome, selfEmploymentIncome, shortTermCapGains, longTermCapGains, ordinaryIncome, _401k, _hsa, otherPretax, traditionalIra, salt, medicalDental, mortgageInterest, charitable, childTaxCredit, educationCredits, retirementSavingsContributions, otherCredit } from "~/lib/config/page/pageConfig.finalTaxContext";

export function makeIncomeNodesConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "totalIncome",
            label: "Total Income",
            shortLabel: "Total Income",
            // sankeySettings: {
            //     node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
            // },
            calculate: (inputs) => {
                return (
                    wageIncome(inputs) +
                    selfEmploymentIncome(inputs) +
                    shortTermCapGains(inputs) +
                    longTermCapGains(inputs) +
                    ordinaryIncome(inputs)
                );
            },
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
                return (
                    wageIncome(inputs) +
                    selfEmploymentIncome(inputs) +
                    shortTermCapGains(inputs) +
                    ordinaryIncome(inputs)
                ) -
                    _401k(inputs) -
                    _hsa(inputs) -
                    otherPretax(inputs) -
                    traditionalIra(inputs)

                    ;
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
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
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
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                link: [
                    { source: "selfEmployment", target: "ordinaryTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                ],
            },
            calculate: selfEmploymentIncome,
        },
        {
            id: "ordinaryIncome",
            label: "Other Ordinary Income",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                link: [
                    { source: "ordinaryIncome", target: "ordinaryTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                ],
            },
            calculate: ordinaryIncome,
        },
        {
            id: "shortTermCapGains",
            label: "Short-Term Capital Gains",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                link: [
                    { source: "shortTermCapGains", target: "ordinaryTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 2 },
                ],
            },
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

            },
        },
        {
            id: "pretaxTakehome",
            label: "Pretax take-home",
            shortLabel: "Pretax take-home",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 4 },

            },

        }]
}
export function makePretaxDeductionsNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
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
            calculate: (inputs) => wageIncome(inputs) - (_401k(inputs) + _hsa(inputs)),
        },
        {
            id: "shieldedIncome",
            label: "Shielded Income",
            shortLabel: "Shielded",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)", row: 1, col: 3 },
            },
            calculate: (inputs) => {
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                return pretax + deduction;
            },
        }];
}

export function make0taxIncomeNodesConfig(_taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "deductionAmount",
            label: "0% tax income tax",
            shortLabel: "Deduction Used",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 3, col: 3 },
                link: [
                    { source: "deductionAmount", target: "takeHomePay", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 3, col: 3 },
                ],
            },
            calculate: (inputs, taxData) => {
                const payrollTax = calculatePayrollTax(inputs, taxData);
                const isItemized = findInputById(inputs, "useItemizedDeductions");
                if (isItemized) {
                    return Math.max(0, salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs) - payrollTax);
                } else {
                    return Math.max(0, getStandardDeduction(taxData, filingStatus) - payrollTax);
                }
            },
        },
    ];
}

export function makeDeductionAmountNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [

        {
            id: "taxableIncomeAfterDeductions",
            label: "Taxable Income After Deductions",
            shortLabel: "Taxable After Ded.",
            sankeySettings: {
                node: { fill: "var(--sankey-node-3)", stroke: "var(--sankey-link)", row: 2, col: 2 },
            },
            calculate: (inputs) => {
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                return Math.max(0, afterPretax - deduction);
            },
        },
        {
            id: "ordinaryTaxableIncome",
            label: "Ordinary Income",
            shortLabel: "Ordinary (Pre-Ded)",
            sankeySettings: {
                node: { fill: "var(--sankey-node-3)", stroke: "var(--sankey-link)", row: 2, col: 2 },

            },
            calculate: (inputs) => {
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                return afterPretax;
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
            calculate: (inputs) => {
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                const ltcgTaxable = longTermCapGains(inputs);
                return ordinaryTaxable + ltcgTaxable;
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
            calculate: (inputs) => {
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                return calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
            },
        },
        {
            id: "federalLongTermCapGainsTax",
            label: "Federal LTCG Tax",
            shortLabel: "Federal LTCG Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 3, col: 1 },
            },
            calculate: (inputs) => {
                const ltcg = longTermCapGains(inputs);
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                return calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinaryTaxable);
            },
        },
        {
            id: "federalNetInvestmentIncomeTax",
            label: "Net Investment Income Tax",
            shortLabel: "NIIT",
            sankeySettings: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 3, col: 1 },
            },
            calculate: (inputs) => {
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
                node: { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)", row: 3, col: 2 },
            },
            calculate: (inputs) => {
                const credits = childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const ordinaryTax = calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
                const ltcgTax = calculateLtcgTaxTotal(longTermCapGains(inputs), taxData.longTermCapGains, filingStatus, ordinaryTaxable);
                const totalTax = ordinaryTax + ltcgTax;
                return Math.min(credits, totalTax);
            },
        },
        {
            id: "socialSecurityTax",
            label: "Social Security Tax",
            shortLabel: "SS Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
            },
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const ssTaxable = Math.min(wages, taxData.payroll.socialSecurityWageBase);
                return ssTaxable * taxData.payroll.socialSecurityRate;
            },
        },
        {
            id: "medicareTax",
            label: "Medicare Tax",
            shortLabel: "Medicare Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-tax)", stroke: "var(--sankey-link-tax)", row: 4, col: 1 },
            },
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                return wages * taxData.payroll.medicareRate;
            },
        },
    ];
}
