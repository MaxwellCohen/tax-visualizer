import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import {
    calculateLtcgTaxTotal,
    calculateOrdinaryTaxTotal,
    findInputById,
    getOrdinaryBrackets,
} from "./pageConfig.helpers";
import {
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
    allPretax,
    totalCredits,
} from "./pageConfig.inputs";

export * from "./pageConfig.inputs";

export function calculatePayrollTax(inputs: TaxFormRow[], taxData: TaxYearConfig): number {
    const wages = wageIncome(inputs);
    const ssTaxable = Math.min(wages, taxData.payroll.socialSecurityWageBase);
    const ssTax = ssTaxable * taxData.payroll.socialSecurityRate;
    const medicareTax = wages * taxData.payroll.medicareRate;
    return ssTax + medicareTax;
};

export function calculateSelfEmploymentTax(inputs: TaxFormRow[], taxData: TaxYearConfig): number {
    const seIncome = selfEmploymentIncome(inputs);
    const netEarnings = seIncome * 0.9235;
    const ssTaxable = Math.min(netEarnings, taxData.payroll.socialSecurityWageBase);
    const ssTax = ssTaxable * taxData.payroll.socialSecurityRate * 2;
    const medicareTax = netEarnings * taxData.payroll.medicareRate * 2;
    return ssTax + medicareTax;
};

function calculateSelfEmploymentTaxFromIncome(seIncome: number, taxData: TaxYearConfig): number {
    const netEarnings = seIncome * 0.9235;
    const ssTaxable = Math.min(netEarnings, taxData.payroll.socialSecurityWageBase);
    const ssTax = ssTaxable * taxData.payroll.socialSecurityRate * 2;
    const medicareTax = netEarnings * taxData.payroll.medicareRate * 2;
    return ssTax + medicareTax;
}

export function calculateSelfEmploymentDeduction(seIncome: number, taxData: TaxYearConfig): number {
    return calculateSelfEmploymentTaxFromIncome(seIncome, taxData) / 2;
}

type TaxableIncomeResult = {
    ordinary: number;
    ltcg: number;
    total: number;
    afterPretax: number;
    deduction: number;
};

export function calculateTaxableIncome(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus
): TaxableIncomeResult {
    const seIncome = selfEmploymentIncome(inputs);
    const seTax = calculateSelfEmploymentTaxFromIncome(seIncome, taxData);
    const seDeduction = seTax / 2;
    const pretax = allPretax(inputs);
    const afterPretax = ordinaryIncome(inputs) - pretax - seDeduction;
    const itemized =  findInputById( inputs, 'deduction-');
    const standard = Math.min(afterPretax, taxData.standardDeduction[filingStatus]);
    const deduction = Math.max(itemized, standard);
    const ordinary = Math.max(0, afterPretax - deduction);
    const ltcg = longTermCapGains(inputs);
    return { ordinary, ltcg, total: ordinary + ltcg, afterPretax, deduction };
}

/** Nonrefundable credits absorbed against federal income tax before credits (capped at gross federal tax). */
export function computeFederalTaxCreditsApplied(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    const credits = totalCredits(inputs);
    const { ordinary, ltcg } = calculateTaxableIncome(inputs, taxData, filingStatus);
    const brackets = getOrdinaryBrackets(taxData, filingStatus);
    const ordinaryTax = calculateOrdinaryTaxTotal(ordinary, brackets).tax;
    const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
    const totalTax = ordinaryTax + ltcgTax;
    return Math.min(credits, totalTax);
}

export function buildFinalTaxContext(taxData: TaxYearConfig, filingStatus: FilingStatus) {
    
    const calculatePayrollTaxFn = (inputs: TaxFormRow[], taxData: TaxYearConfig, ) => calculatePayrollTax(inputs, taxData)


    const calculateSelfEmploymentTax = (inputs: TaxFormRow[]): number => {
        const seIncome = selfEmploymentIncome(inputs);
        const netEarnings = seIncome * 0.9235;
        const ssTaxable = Math.min(netEarnings, taxData.payroll.socialSecurityWageBase);
        const ssTax = ssTaxable * taxData.payroll.socialSecurityRate * 2;
        const medicareTax = netEarnings * taxData.payroll.medicareRate * 2;
        return ssTax + medicareTax;
    };

    const calculateFederalIncomeTaxAfterCredits = (inputs: TaxFormRow[]): number => {
        const { ordinary, ltcg } = calculateTaxableIncome(inputs, taxData, filingStatus);
        const brackets = getOrdinaryBrackets(taxData, filingStatus);
        const ordinaryTax = calculateOrdinaryTaxTotal(ordinary, brackets).tax;
        const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
        const totalTax = ordinaryTax + ltcgTax;
        const credits = childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);
        return Math.max(0, totalTax - credits);
    };

    return {
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
        calculatePayrollTax: calculatePayrollTaxFn,
        calculateSelfEmploymentTax,
        calculateFederalIncomeTaxAfterCredits,
    };
}
