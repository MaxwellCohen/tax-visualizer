import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import {
    calculateLtcgTaxTotal,
    calculateOrdinaryTaxTotal,
    findInputById,
    getOrdinaryBrackets,
    getStandardDeduction,
} from "./pageConfig.helpers";

export function buildFinalTaxContext(taxData: TaxYearConfig, filingStatus: FilingStatus) {
    const wageIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "wages");
    const selfEmploymentIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "selfEmployment");
    const ordinaryIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "ordinary");
    const shortTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "shortTermCapGains");
    const longTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "longTermCapGains");

    const _401k = (inputs: TaxFormRow[]) => findInputById(inputs, "401k");
    const _hsa = (inputs: TaxFormRow[]) => findInputById(inputs, "hsa");
    const otherPretax = (inputs: TaxFormRow[]) => findInputById(inputs, "otherPretax");
    const traditionalIra = (inputs: TaxFormRow[]) => findInputById(inputs, "traditionalIra");

    const salt = (inputs: TaxFormRow[]) => findInputById(inputs, "salt");
    const medicalDental = (inputs: TaxFormRow[]) => findInputById(inputs, "medicalDental");
    const mortgageInterest = (inputs: TaxFormRow[]) => findInputById(inputs, "mortgageInterest");
    const charitable = (inputs: TaxFormRow[]) => findInputById(inputs, "charitable");

    const childTaxCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "childTaxCredit");
    const educationCredits = (inputs: TaxFormRow[]) => findInputById(inputs, "educationCredits");
    const retirementSavingsContributions = (inputs: TaxFormRow[]) => findInputById(inputs, "retirementSavingsContributions");
    const otherCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "otherFederalCredit");

    const calculatePayrollTax = (inputs: TaxFormRow[]): number => {
        const wages = wageIncome(inputs);
        const ssTaxable = Math.min(wages, taxData.payroll.socialSecurityWageBase);
        const ssTax = ssTaxable * taxData.payroll.socialSecurityRate;
        const medicareTax = wages * taxData.payroll.medicareRate;
        return ssTax + medicareTax;
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
        const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, 0);
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
        calculatePayrollTax,
        calculateSelfEmploymentTax,
        calculateFederalIncomeTaxAfterCredits,
    };
}
