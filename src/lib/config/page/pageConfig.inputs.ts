import type { TaxFormRow } from "~/lib/taxForm.types";
import { findInputById } from "./pageConfig.helpers";

export const wageIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "income-ordinary-wages");
export const selfEmploymentIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "income-ordinary-selfEmployment");
export const ordinaryIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "income-ordinary");
export const shortTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "income-ordinary-shortTermCapGains");
export const longTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "income-longTermCapGains");
export const _401k = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax-401K");
export const _hsa = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax-hsa");
export const otherPretax = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax-otherPretax");
export const allPretax = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax");
export const traditionalIra = (inputs: TaxFormRow[]) => findInputById(inputs, "input-pretax-traditionalIra");
export const salt = (inputs: TaxFormRow[]) => findInputById(inputs, "deduction-salt");
export const medicalDental = (inputs: TaxFormRow[]) => findInputById(inputs, "deduction-medicalDental");
export const mortgageInterest = (inputs: TaxFormRow[]) => findInputById(inputs, "deduction-mortgageInterest");
export const charitable = (inputs: TaxFormRow[]) => findInputById(inputs, "deduction-charitable");
export const childTaxCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "input-credit-childTax");
export const educationCredits = (inputs: TaxFormRow[]) => findInputById(inputs, "input-credit-education");
export const retirementSavingsContributions = (inputs: TaxFormRow[]) => findInputById(inputs, "retirementSavingsContributions");
export const otherCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "input-credit-other");
export const useItemizedDeductions = (inputs: TaxFormRow[]) => findInputById(inputs, "useItemizedDeductions");

export const totalCredits = (inputs: TaxFormRow[]) =>
    childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);

export const totalPretax = (inputs: TaxFormRow[]) =>
    _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);

export const totalItemized = (inputs: TaxFormRow[]) =>
    salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);

export const totalIncome = (inputs: TaxFormRow[]) =>
    wageIncome(inputs) + selfEmploymentIncome(inputs) + shortTermCapGains(inputs) + longTermCapGains(inputs) + ordinaryIncome(inputs);

export const afterPretaxIncome = (inputs: TaxFormRow[], seDeduction: number) =>
    totalIncome(inputs) - allPretax(inputs) - seDeduction;