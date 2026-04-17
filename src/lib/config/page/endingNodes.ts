/** Ending metrics: take-home pay, effective tax rate, marginal federal rate. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { calculateLtcgTaxTotal, calculateOrdinaryTaxTotal, getOrdinaryBrackets, getStandardDeduction } from "./pageConfig.helpers";
import { buildFinalTaxContext } from "./taxCalculations";

export function makeEndingNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const ctx = buildFinalTaxContext(taxData, filingStatus);
    const {
        wageIncome,
        selfEmploymentIncome,
        ordinaryIncome,
        shortTermCapGains,
        longTermCapGains,
        _401k,
        _hsa,
        otherPretax,
        traditionalIra,
        salt,
        medicalDental,
        mortgageInterest,
        charitable,
        childTaxCredit,
        educationCredits,
        retirementSavingsContributions,
        otherCredit,
        calculatePayrollTax,
        calculateSelfEmploymentTax,
        calculateFederalIncomeTaxAfterCredits,
    } = ctx;

    return [
        {
            id: "federalPayrollTaxes",
            label: "Federal Payroll Taxes",
            shortLabel: "Federal Payroll Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 2, col: 4 },
            },
        },
        {
            id: "federalSelfEmploymentTaxes",
            label: "Federal Self-Employment Taxes",
            shortLabel: "Federal SE Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 2, col: 4 },
            },
        },
        {
            id: "takeHomePay",
            label: "Take-Home Pay",
            shortLabel: "Take-Home Pay",
            sankeySettings: {
                node: { fill: "var(--sankey-node-keep)", stroke: "var(--sankey-link-keep)", row: 3, col: 4 },
            },
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const seIncome = selfEmploymentIncome(inputs);
                const seTax = calculateSelfEmploymentTax(inputs);
                const seDeduction = seTax / 2;
                const ordinary = ordinaryIncome(inputs);
                const stcg = shortTermCapGains(inputs);
                const ltcg = longTermCapGains(inputs);
                const totalIncome = wages + seIncome + ordinary + stcg + ltcg;
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const saltAmt = salt(inputs);
                const medical = medicalDental(inputs);
                const mortgage = mortgageInterest(inputs);
                const charity = charitable(inputs);
                const itemized = saltAmt + medical + mortgage + charity;
                const standard = getStandardDeduction(inputs, taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const ordinaryTaxable = Math.max(0, wages + seIncome + ordinary + stcg - pretax - deduction - seDeduction);
                const ordinaryTax = calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
                const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinaryTaxable);
                const credits = childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);
                const federalTax = Math.max(0, ordinaryTax + ltcgTax - credits);
                const payrollTax = calculatePayrollTax(inputs, taxData);
                return Math.max(0, totalIncome - pretax - deduction - federalTax - payrollTax - seTax);
            },
            summary: {
                summaryId: "take-home-pay",
                label: "Take-Home Pay",
                category: "takehome",
                displayOrder: 6,
                format: "currency",
                highlight: true,
            },
        },
        {
            id: "federalIncomeTax",
            label: "Federal Income Tax",
            shortLabel: "Federal Income Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)", row: 4, col: 4 },
            },
            calculate: calculateFederalIncomeTaxAfterCredits,
            summary: {
                summaryId: "federal-income-tax",
                label: "Federal Income Tax",
                category: "tax",
                displayOrder: 4,
                format: "currency",
                highlight: true,
            },
        },

        {
            id: "effectiveTaxRate",
            label: "Effective Tax Rate",
            shortLabel: "Effective Rate",
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const seIncome = selfEmploymentIncome(inputs);
                const ordinary = ordinaryIncome(inputs);
                const stcg = shortTermCapGains(inputs);
                const ltcg = longTermCapGains(inputs);
                const totalIncome = wages + seIncome + ordinary + stcg + ltcg;
                if (totalIncome <= 0) return 0;
                const federalTax = calculateFederalIncomeTaxAfterCredits(inputs);
                return federalTax / totalIncome;
            },
            summary: {
                summaryId: "effective-tax-rate",
                label: "Effective Tax Rate",
                category: "rate",
                displayOrder: 7,
                format: "percent",
            },
        },
        {
            id: "marginalFederalRate",
            label: "Marginal Tax Rate",
            shortLabel: "Marginal Rate",
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const seIncome = selfEmploymentIncome(inputs);
                const seTax = calculateSelfEmploymentTax(inputs);
                const seDeduction = seTax / 2;
                const ordinary = ordinaryIncome(inputs);
                const stcg = shortTermCapGains(inputs);
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(inputs, taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const taxableIncome = Math.max(0, wages + seIncome + ordinary + stcg - pretax - deduction - seDeduction);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const result = calculateOrdinaryTaxTotal(taxableIncome, brackets);
                return result.marginalRate;
            },
            summary: {
                summaryId: "marginal-tax-rate",
                label: "Marginal Tax Rate",
                category: "rate",
                displayOrder: 8,
                format: "percent",
            },
        },
    ];
}
