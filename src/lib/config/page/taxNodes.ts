/** Tax nodes: federal income tax (and credits into tax), payroll tax, self-employment tax. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    calculateLtcgTaxTotal,
    calculateOrdinaryTaxTotal,
    getOrdinaryBrackets,
    getStandardDeduction,
} from "./pageConfig.helpers";
import { buildFinalTaxContext } from "./pageConfig.finalTaxContext";

export function makeTaxNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
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
            id: "federalIncomeTaxBeforeCredits",
            label: "Fed Tax Before Credits",
            shortLabel: "Fed Tax Before Credits",
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const seIncome = selfEmploymentIncome(inputs);
                const ordinary = ordinaryIncome(inputs);
                const stcg = shortTermCapGains(inputs);
                const ltcg = longTermCapGains(inputs);
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const afterPretax = wages + seIncome + ordinary + stcg - pretax;
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const ordinaryTax = calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
                const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, 0);
                return ordinaryTax + ltcgTax;
            },
        },
        {
            id: "federalTaxCredits",
            label: "Federal Tax Credits",
            shortLabel: "Credits",
            sankeySettings: {
                node: { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)" },
                link: [
                    { source: "federalTaxCredits", target: "federalIncomeTax", fill: "var(--sankey-link-credits)", stroke: "var(--sankey-link-credits)" },
                ],
            },
            calculate: (inputs) => {
                return childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);
            },
        },
        {
            id: "payrollTax",
            label: "Payroll Taxes",
            shortLabel: "Payroll Taxes",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)" },
                link: [
                    { source: "ordinaryTaxableIncome", target: "payrollTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                    { source: "payrollTax", target: "federalPayrollTaxes", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                    // { source: "payrollTax", target: "payrollTaxes", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },       
                ],
            },
            calculate: calculatePayrollTax,
            summary: {
                summaryId: "payroll-tax",
                label: "Payroll Tax",
                category: "tax",
                displayOrder: 5,
                format: "currency",
            },
        },
        {
            id: "selfEmploymentTax",
            label: "Self-Employment Tax",
            shortLabel: "Self-Employment Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)" },
                link: [
                    { source: "selfEmploymentTax", target: "takeHomePay", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                ],
            },
            calculate: calculateSelfEmploymentTax,
        },
    ];
}
