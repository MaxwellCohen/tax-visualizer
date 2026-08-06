import type { TaxFormRow } from "~/lib/tax/form/types";
import { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import { buildScenarioMetrics } from "~/lib/tax/calc/scenarioMetrics";

export const wageIncomeSpouse1 = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).income.wagesSpouse1;
export const wageIncomeSpouse2 = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).income.wagesSpouse2;
export const wageIncome = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).income.wages;
export const selfEmploymentIncome = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).income.selfEmployment;
export const ordinaryIncome = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).income.ordinary;
export const shortTermCapGains = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).income.shortTermCapGains;
export const longTermCapGains = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).income.longTermCapGains;

/** 401(k)/403(b)/457(b) elective rows; excludes age-50+ catch-up (separate config item). */
export const electiveDeferrals401kFamilyExcludingCatchUp = (inputs: TaxFormRow[]) =>
    buildScenarioMetrics(inputs).pretax.electiveDeferrals401kFamilyExcludingCatchUp;

export const _401k = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).pretax.preTax401k;
export const _hsa = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).pretax.hsa;
export const otherPretax = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).pretax.other;
export const allPretax = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).pretax.all;
export const traditionalIra = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).pretax.traditionalIra;
const qualifyingChildren = (inputs: TaxFormRow[]) => Math.max(0, buildScenarioMetrics(inputs).qualifyingChildren);
const otherDependents = (inputs: TaxFormRow[]) => Math.max(0, buildScenarioMetrics(inputs).otherDependents);
export const childTaxCredit = (inputs: TaxFormRow[], taxData: TaxYearConfig) => {
    const childCredit = taxData.federalTaxCreditDefaults.childTaxCredit ?? 0;
    const otherDependentCredit = taxData.federalTaxCreditDefaults.creditForOtherDependents ?? 0;
    return (qualifyingChildren(inputs) * childCredit) + (otherDependents(inputs) * otherDependentCredit);
};
export const educationCredits = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).credits.education;
export const retirementSavingsContributions = (inputs: TaxFormRow[]) =>
    buildScenarioMetrics(inputs).credits.retirementSavingsContributions;
export const otherCredit = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).credits.other;
export const useItemizedDeductions = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).useItemizedDeductions ? 1 : 0;

export const totalCredits = (inputs: TaxFormRow[], taxData: TaxYearConfig) =>
    childTaxCredit(inputs, taxData) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);


export const totalItemized = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).deductions.totalItemized;

export const standardDeduction = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => {
    const statutory = taxData.standardDeduction[filingStatus];
    const incomeAvailable = Math.max(
        0,
        ordinaryIncome(inputs) - allPretax(inputs) + longTermCapGains(inputs),
    );
    return Math.min(statutory, incomeAvailable);
}
export const totalDeductions = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => useItemizedDeductions(inputs) ? totalItemized(inputs) : standardDeduction(inputs, taxData, filingStatus) ;
   

export const totalIncome = (inputs: TaxFormRow[]) => buildScenarioMetrics(inputs).income.total;

