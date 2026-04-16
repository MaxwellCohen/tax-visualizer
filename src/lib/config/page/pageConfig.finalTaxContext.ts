import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import {
    calculateLtcgTaxTotal,
    calculateOrdinaryTaxTotal,
    findInputById,
    getOrdinaryBrackets,
    getStandardDeduction,
} from "./pageConfig.helpers";

export const wageIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "wages");
export const selfEmploymentIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "selfEmployment");
export const ordinaryIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "ordinary");
export const shortTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "shortTermCapGains");
export const longTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "longTermCapGains");
export const _401k = (inputs: TaxFormRow[]) => findInputById(inputs, "401k");
export const _hsa = (inputs: TaxFormRow[]) => findInputById(inputs, "hsa");
export const otherPretax = (inputs: TaxFormRow[]) => findInputById(inputs, "otherPretax");
export const traditionalIra = (inputs: TaxFormRow[]) => findInputById(inputs, "traditionalIra");
export const salt = (inputs: TaxFormRow[]) => findInputById(inputs, "salt");
export const medicalDental = (inputs: TaxFormRow[]) => findInputById(inputs, "medicalDental");
export const mortgageInterest = (inputs: TaxFormRow[]) => findInputById(inputs, "mortgageInterest");
export const charitable = (inputs: TaxFormRow[]) => findInputById(inputs, "charitable");
export const childTaxCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "childTaxCredit");
export const educationCredits = (inputs: TaxFormRow[]) => findInputById(inputs, "educationCredits");
export const retirementSavingsContributions = (inputs: TaxFormRow[]) => findInputById(inputs, "retirementSavingsContributions");
export const otherCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "otherFederalCredit");
export const calculatePayrollTax = (inputs: TaxFormRow[], taxData: TaxYearConfig): number => {
    const wages = wageIncome(inputs);
    const ssTaxable = Math.min(wages, taxData.payroll.socialSecurityWageBase);
    const ssTax = ssTaxable * taxData.payroll.socialSecurityRate;
    const medicareTax = wages * taxData.payroll.medicareRate;
    return ssTax + medicareTax;
};


export function buildFinalTaxContext(taxData: TaxYearConfig, filingStatus: FilingStatus) {
    
   const calculatePayrollTaxFn = (inputs: TaxFormRow[]): number => {
    return calculatePayrollTax(inputs, taxData);
   };

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
