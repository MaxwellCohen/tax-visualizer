import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import {
    calculateLtcgTaxTotal,
    calculateOrdinaryTaxTotal,
    getOrdinaryBrackets,
    getStandardDeduction,
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
        const wages = wageIncome(inputs);
        const seIncome = selfEmploymentIncome(inputs);
        const seTax = seIncome * 0.9235 * (taxData.payroll.socialSecurityRate * 2 + taxData.payroll.medicareRate * 2);
        const seDeduction = seTax / 2;
        const ordinary = ordinaryIncome(inputs);
        const stcg = shortTermCapGains(inputs);
        const ltcg = longTermCapGains(inputs);
        const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
        const afterPretax = wages + seIncome + ordinary + stcg - pretax - seDeduction;
        const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
        const standard = getStandardDeduction(inputs, taxData, filingStatus);
        const deduction = Math.max(itemized, standard);
        const ordinaryTaxable = Math.max(0, afterPretax - deduction);
        const brackets = getOrdinaryBrackets(taxData, filingStatus);
        const ordinaryTax = calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
        const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinaryTaxable);
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
