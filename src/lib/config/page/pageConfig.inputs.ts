import type { TaxFormRow } from "~/lib/taxForm.types";
import { findInputById } from "./inputAccessors";
import { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";

const sumInputsByKinds = (inputs: TaxFormRow[], ...kinds: string[]): number =>
    inputs.reduce((sum, row) => {
        if (row.type === "setting") return sum;
        const rowKind = row.kind?.toLowerCase();
        if (!rowKind || !kinds.every((kind) => rowKind.includes(kind.toLowerCase()))) return sum;
        return sum + row.amount;
    }, 0);

export const wageIncomeSpouse1 = (inputs: TaxFormRow[]) =>
    sumInputsByKinds(inputs, "income-ordinary-wages") - sumInputsByKinds(inputs, "income-ordinary-wages", "spouse2");
export const wageIncomeSpouse2 = (inputs: TaxFormRow[]) => sumInputsByKinds(inputs, "income-ordinary-wages", "spouse2");
export const wageIncome = (inputs: TaxFormRow[]) => wageIncomeSpouse1(inputs) + wageIncomeSpouse2(inputs);
export const selfEmploymentIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "income-ordinary-selfEmployment");
export const ordinaryIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "income-ordinary");
export const shortTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "income-ordinary-shortTermCapGains");
export const longTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "income-longTermCapGains");
export const _401k = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax-401K");
export const _hsa = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax-hsa");
export const otherPretax = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax-otherPretax");
export const allPretax = (inputs: TaxFormRow[]) => {
    const pretax = findInputById(inputs, "input-pretax");
    const wageIncome = findInputById(inputs, "income-ordinary-wages");
    return Math.min(pretax, wageIncome);
};
export const traditionalIra = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax-traditionalIra");
export const salt = (inputs: TaxFormRow[]) => findInputById(inputs, "deduction-salt");
export const medicalDental = (inputs: TaxFormRow[]) => findInputById(inputs, "deduction-medicalDental");
export const mortgageInterest = (inputs: TaxFormRow[]) => findInputById(inputs, "deduction-mortgageInterest");
export const charitable = (inputs: TaxFormRow[]) => findInputById(inputs, "deduction-charitable");
export const qualifyingChildren = (inputs: TaxFormRow[]) => Math.max(0, findInputById(inputs, "qualifyingChildren"));
export const otherDependents = (inputs: TaxFormRow[]) => Math.max(0, findInputById(inputs, "otherDependents"));
export const childTaxCredit = (inputs: TaxFormRow[], taxData: TaxYearConfig) => {
    const childCredit = taxData.federalTaxCreditDefaults.childTaxCredit ?? 0;
    const otherDependentCredit = taxData.federalTaxCreditDefaults.creditForOtherDependents ?? 0;
    return (qualifyingChildren(inputs) * childCredit) + (otherDependents(inputs) * otherDependentCredit);
};
export const educationCredits = (inputs: TaxFormRow[]) => findInputById(inputs, "input-credit-education");
export const retirementSavingsContributions = (inputs: TaxFormRow[]) => findInputById(inputs, "retirementSavingsContributions");
export const otherCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "input-credit-other");
export const useItemizedDeductions = (inputs: TaxFormRow[]) => findInputById(inputs, "useItemizedDeductions");

export const totalCredits = (inputs: TaxFormRow[], taxData: TaxYearConfig) =>
    childTaxCredit(inputs, taxData) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);


export const totalItemized = (inputs: TaxFormRow[]) => {
    const deductions = findInputById(inputs, 'deduction-');
    const postTaxIncome = Math.max(0, ordinaryIncome(inputs) - allPretax(inputs));
    return Math.min(deductions, postTaxIncome);
}

export const standardDeduction = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => {
    const standardDeduction = taxData.standardDeduction[filingStatus];
    const postTaxIncome = Math.max(0, ordinaryIncome(inputs) - allPretax(inputs));
    return Math.min(standardDeduction, postTaxIncome);
}
export const totalDeductions = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => useItemizedDeductions(inputs) ? totalItemized(inputs) : standardDeduction(inputs, taxData, filingStatus) ;
   

export const totalIncome = (inputs: TaxFormRow[]) => longTermCapGains(inputs) + ordinaryIncome(inputs);

