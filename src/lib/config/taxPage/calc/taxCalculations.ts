import type { FilingStatus, FederalTaxBracket, LongTermCapGainsThresholds, TaxYearConfig } from "~/lib/tax/data/types";
import type { TaxFormRow } from "~/lib/tax/form/types";
import {
    wageIncome,
    wageIncomeSpouse1,
    wageIncomeSpouse2,
    selfEmploymentIncome,
    ordinaryIncome,
    longTermCapGains,
    _401k,
    _hsa,
    allPretax,
    totalCredits,
    totalItemized,
    useItemizedDeductions,
    standardDeduction as standardDeductionInput,
    totalDeductions,
} from "../rowMetrics";

type PayrollTaxBreakdown = {
    socialSecurityTax: number;
    medicareTax: number;
    total: number;
};

function calculatePayrollTaxForWages(wages: number, taxData: TaxYearConfig): PayrollTaxBreakdown {
    const taxableWages = Math.max(0, wages);
    const ssTaxable = Math.min(taxableWages, taxData.payroll.socialSecurityWageBase);
    const ssTax = ssTaxable * taxData.payroll.socialSecurityRate;
    const medicareTax = taxableWages * taxData.payroll.medicareRate;
    return { socialSecurityTax: ssTax, medicareTax, total: ssTax + medicareTax };
}

export function calculatePayrollTaxBreakdown(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): PayrollTaxBreakdown {
    const spouseWages =
        filingStatus === "marriedJoint"
            ? [wageIncomeSpouse1(inputs), wageIncomeSpouse2(inputs)]
            : [wageIncome(inputs)];
    return spouseWages
        .map((wages) => calculatePayrollTaxForWages(wages, taxData))
        .reduce(
            (sum, spouseTax) => ({
                socialSecurityTax: sum.socialSecurityTax + spouseTax.socialSecurityTax,
                medicareTax: sum.medicareTax + spouseTax.medicareTax,
                total: sum.total + spouseTax.total,
            }),
            { socialSecurityTax: 0, medicareTax: 0, total: 0 },
        );
}

export function calculatePayrollTax(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    return calculatePayrollTaxBreakdown(inputs, taxData, filingStatus).total;
};

export function calculateSelfEmploymentTax(inputs: TaxFormRow[], taxData: TaxYearConfig): number {
    return calculateSelfEmploymentTaxFromIncome(selfEmploymentIncome(inputs), taxData);
};

function calculateSelfEmploymentTaxFromIncome(seIncome: number, taxData: TaxYearConfig): number {
    const netEarnings = seIncome * taxData.payroll.selfEmploymentNetEarningsFactor;
    const ssTaxable = Math.min(netEarnings, taxData.payroll.socialSecurityWageBase);
    const ssTax = ssTaxable * taxData.payroll.selfEmploymentSocialSecurityRate;
    const medicareTax = netEarnings * taxData.payroll.selfEmploymentMedicareRate;
    return ssTax + medicareTax;
}

export function calculateSelfEmploymentDeduction(seIncome: number, taxData: TaxYearConfig): number {
    return calculateSelfEmploymentTaxFromIncome(seIncome, taxData) / 2;
}

export function getStandardDeductionWithoutPayrollTax(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    if (useItemizedDeductions(inputs)) return 0;
    const standardDeductionValue = standardDeductionInput(inputs, taxData, filingStatus);
    const payrollTaxTotalValue = payrollTaxTotal(inputs, taxData, filingStatus);
    return Math.max(0, standardDeductionValue - payrollTaxTotalValue);
}

export function getItemizedDeductionsWithoutPayrollTax(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    if (!useItemizedDeductions(inputs)) return 0;
    const payrollTaxTotalValue = payrollTaxTotal(inputs, taxData, filingStatus);
    const totalItemizedValue = totalItemized(inputs)
    return Math.max(0, totalItemizedValue - payrollTaxTotalValue);
}

const getDeductionsWithoutPayrollTax = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number => {
    if (useItemizedDeductions(inputs)) return getItemizedDeductionsWithoutPayrollTax(inputs, taxData, filingStatus);
    return getStandardDeductionWithoutPayrollTax(inputs, taxData, filingStatus);
}


 function calculateLtcgTaxTotal(
    taxableLtcg: number,
    thresholds: LongTermCapGainsThresholds,
    filingStatus: FilingStatus,
    baseIncome: number
): number {
    let totalTax = 0;
    let remaining = taxableLtcg;
    let lowerBound = baseIncome;

    const bracketSet = thresholds.find((threshold) => threshold.filingStatus === filingStatus);
    if (!bracketSet) {
        throw new Error(`Missing long-term capital gains brackets for filing status: ${filingStatus}`);
    }

    for (const bracket of bracketSet.brackets) {
        if (remaining <= 0) break;
        const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
        const amountInBracket = Math.max(0, Math.min(remaining, Math.max(0, upperBound - lowerBound)));
        if (amountInBracket > 0) {
            const taxAmount = amountInBracket * bracket.rate;
            totalTax += taxAmount;
            remaining -= amountInBracket;
        }
        lowerBound = upperBound;
    }
    return totalTax;
}


function payrollTaxTotal(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    return calculatePayrollTax(inputs, taxData, filingStatus) + calculateSelfEmploymentTax(inputs, taxData);
}

export const ordinaryIncomeAfterPretax = (inputs: TaxFormRow[]): number => {
    return Math.max(0, ordinaryIncome(inputs) - allPretax(inputs));
}

const taxableIncomeAfterDeductions = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number => {
    const payrollTaxTotalValue = payrollTaxTotal(inputs, taxData, filingStatus);
    const deduction = getDeductionsWithoutPayrollTax(inputs, taxData, filingStatus);
    return Math.max(0, ordinaryIncomeAfterPretax(inputs) - payrollTaxTotalValue - deduction);
}


export function calculateTaxableIncome(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus
) {
    const shieldCapBeforePayroll = useItemizedDeductions(inputs)
        ? totalItemized(inputs)
        : standardDeductionInput(inputs, taxData, filingStatus);
    const payrollTaxTotalValue = payrollTaxTotal(inputs, taxData, filingStatus);
    const deduction = getDeductionsWithoutPayrollTax(inputs, taxData, filingStatus);
    const ordinary = taxableIncomeAfterDeductions(inputs, taxData, filingStatus);
    const payrollBracketShadowFill = Math.max(0, payrollTaxTotalValue - shieldCapBeforePayroll);
    const ltcg = longTermCapGains(inputs);
    return {
        ordinary,
        ltcg,
        total: ordinary + ltcg,
        afterPretax: ordinaryIncomeAfterPretax(inputs),
        deduction: deduction,
        payrollTaxTotal: payrollTaxTotal(inputs, taxData, filingStatus),
        payrollBracketShadowFill,
    };
}


/** Nonrefundable credits absorbed against federal income tax before credits (capped at gross federal tax). */
export function computeFederalTaxCreditsApplied(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    const buckets = calculateTaxBuckets(inputs, taxData, filingStatus);
    const credits = buckets.reduce((sum, bucket) => sum + bucket.credits, 0); 
    return credits;
}


export function calculateTaxBuckets(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) {
    const result: Array<{
        taxBracket?: FederalTaxBracket;
        type: string;
        tax: number;
        keep: number;
        credits: number;
        payrollTax: number;
        remainingIncome: number;
    }> = [];
    const brackets = taxData.federalBrackets[filingStatus];
    const income = ordinaryIncome(inputs) - allPretax(inputs);
    const payrollTaxTotal = calculatePayrollTax(inputs, taxData, filingStatus) + calculateSelfEmploymentTax(inputs, taxData);
    const deductions = totalDeductions(inputs, taxData, filingStatus);
    let remainingIncome = income - deductions;
    let remainingPayrollTax = Math.max(payrollTaxTotal - deductions, 0);
    let remainingCredits = totalCredits(inputs, taxData);
    console.log("result", {
        payrollTaxTotal, deductions,
        remainingIncome,
        remainingPayrollTax,
        remainingCredits,
    });
    // loop through all brackets to calculate the tax and keep
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const bracketMax = bracket?.upTo ?? Infinity;
        const taxableBracketIncome = Math.min(remainingIncome, bracketMax);
        remainingIncome = Math.max(0, remainingIncome - taxableBracketIncome)
        const tax = taxableBracketIncome * bracket.rate;
        const keep = Math.max(taxableBracketIncome - tax - remainingPayrollTax, 0);
        remainingPayrollTax = Math.max(0, remainingPayrollTax - (taxableBracketIncome - tax));
        result.push({ type: "ordinary", taxBracket: bracket, tax, keep, credits: 0, payrollTax: remainingPayrollTax, remainingIncome: remainingIncome });
    };
    // adding in the LTCG tax path
    const ltcg = longTermCapGains(inputs);
    const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, income);
    result.push({ type: 'ltcg', tax: ltcgTax, keep: ltcg - ltcgTax, credits: 0, payrollTax: 0, remainingIncome: 0 });

    // loop thorough backwards and add in the credit calculations using result from the forward pass
    for (let i = result.length - 1; i >= 0; i--) {
        const bracket = result[i];
        const credits = Math.min(remainingCredits, bracket.tax);
        bracket.credits = Math.max(0, credits);
        bracket.tax = Math.max(0, bracket.tax - credits);
        remainingCredits -= credits;
    }
    return result;
}