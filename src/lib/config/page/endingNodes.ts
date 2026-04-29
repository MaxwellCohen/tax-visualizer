/** Ending metrics: take-home pay, effective tax rate, marginal federal rate. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { getOrdinaryBrackets } from "./pageConfig.helpers";
import {
    buildFinalTaxContext,
    calculateOrdinaryTaxWithPayrollShadow,
    calculateTaxableIncome,
    totalIncome,
} from "./taxCalculations";

export function makeEndingNodesConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const ctx = buildFinalTaxContext(taxData, filingStatus);
    const {
        _401k,
        _hsa,
        otherPretax,
        traditionalIra,
        calculatePayrollTax,
        calculateSelfEmploymentTax,
        calculateFederalIncomeTaxAfterCredits,
    } = ctx;

    return [
        {
            id: "federalPayrollTaxes",
            label: "Federal Payroll & Self-Employment Taxes",
            shortLabel: "Federal Payroll / SE Tax",
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
                const gross = totalIncome(inputs);
                const seTax = calculateSelfEmploymentTax(inputs);
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const federalTax = calculateFederalIncomeTaxAfterCredits(inputs);
                const payrollTax = calculatePayrollTax(inputs, taxData);
                return Math.max(0, gross - pretax - federalTax - payrollTax - seTax);
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
                const gross = totalIncome(inputs);
                if (gross <= 0) return 0;
                const federalTax = calculateFederalIncomeTaxAfterCredits(inputs);
                return federalTax / gross;
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
                const { ordinary, payrollBracketShadowFill } = calculateTaxableIncome(inputs, taxData, filingStatus);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                return calculateOrdinaryTaxWithPayrollShadow(ordinary, brackets, payrollBracketShadowFill).marginalRate;
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
