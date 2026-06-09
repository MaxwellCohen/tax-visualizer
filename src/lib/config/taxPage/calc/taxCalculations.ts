import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { TaxFormRow } from "~/lib/tax/form/types";
import { buildScenarioMetrics } from "~/lib/tax/calc/scenarioMetrics";
import { evaluateTaxScenario, type PayrollTaxBreakdown, type TaxBucket } from "~/lib/tax/calc/taxEvaluation";

export function calculatePayrollTaxBreakdown(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): PayrollTaxBreakdown {
    return evaluateTaxScenario(inputs, taxData, filingStatus).payrollTaxBreakdown;
}

export function calculatePayrollTax(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    return evaluateTaxScenario(inputs, taxData, filingStatus).payrollTax;
};

export function calculateSelfEmploymentTax(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    return evaluateTaxScenario(inputs, taxData, filingStatus).selfEmploymentTax;
}

export function calculateSelfEmploymentDeduction(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    return evaluateTaxScenario(inputs, taxData, filingStatus).selfEmploymentDeduction;
}

export function getStandardDeductionWithoutPayrollTax(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    return evaluateTaxScenario(inputs, taxData, filingStatus).standardDeductionWithoutPayrollTax;
}

export function getItemizedDeductionsWithoutPayrollTax(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    return evaluateTaxScenario(inputs, taxData, filingStatus).itemizedDeductionsWithoutPayrollTax;
}


export const ordinaryIncomeAfterPretax = (inputs: TaxFormRow[]): number => {
    const metrics = buildScenarioMetrics(inputs);
    return Math.max(0, metrics.income.ordinary - metrics.pretax.all);
}

export const taxableIncomeAfterDeductions = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number => {
    return evaluateTaxScenario(inputs, taxData, filingStatus).taxableIncomeAfterDeductions;
}


export function totalTaxableIncome(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus
): number {
    return evaluateTaxScenario(inputs, taxData, filingStatus).totalTaxableIncome;
}

/** Nonrefundable credits absorbed against federal income tax before credits (capped at gross federal tax). */
export function computeFederalTaxCreditsApplied(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    return evaluateTaxScenario(inputs, taxData, filingStatus).federalTaxCreditsApplied;
}

export function calculateTaxBuckets(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): Array<TaxBucket> {
    return evaluateTaxScenario(inputs, taxData, filingStatus).taxBuckets;
}