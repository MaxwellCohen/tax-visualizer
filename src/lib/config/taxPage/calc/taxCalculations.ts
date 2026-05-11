import type { FilingStatus, FederalTaxBracket, LongTermCapGainsThresholds, TaxYearConfig } from "~/lib/tax/data/types";
import type { TaxFormRow } from "~/lib/tax/form/types";
import {
    wageIncome,
    wageIncomeSpouse1,
    wageIncomeSpouse2,
    selfEmploymentIncome,
    ordinaryIncome,
    longTermCapGains,
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
    const fromWages = spouseWages
        .map((wages) => calculatePayrollTaxForWages(wages, taxData))
        .reduce(
            (sum, spouseTax) => ({
                socialSecurityTax: sum.socialSecurityTax + spouseTax.socialSecurityTax,
                medicareTax: sum.medicareTax + spouseTax.medicareTax,
                total: sum.total + spouseTax.total,
            }),
            { socialSecurityTax: 0, medicareTax: 0, total: 0 },
        );
    const netSeForMedicare =
        Math.max(0, selfEmploymentIncome(inputs)) * taxData.payroll.selfEmploymentNetEarningsFactor;
    const totalMedicareCompensation =
        spouseWages.reduce((s, w) => s + Math.max(0, w), 0) + netSeForMedicare;
    const threshold = taxData.payroll.additionalMedicareThreshold[filingStatus];
    const additionalMedicareTax = Math.max(0, totalMedicareCompensation - threshold) * taxData.payroll.additionalMedicareRate;
    return {
        socialSecurityTax: fromWages.socialSecurityTax,
        medicareTax: fromWages.medicareTax + additionalMedicareTax,
        total: fromWages.total + additionalMedicareTax,
    };
}

export function calculatePayrollTax(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    return calculatePayrollTaxBreakdown(inputs, taxData, filingStatus).total;
};

export function calculateSelfEmploymentTax(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    return calculateSelfEmploymentTaxFromIncome(selfEmploymentIncome(inputs), taxData, filingStatus, inputs);
}

/** SE Social Security shares one annual wage base with modeled W-2 wages (SE attributed to primary earner in MFJ). */
function calculateSelfEmploymentTaxFromIncome(
    seIncome: number,
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
    inputs: TaxFormRow[],
): number {
    const netEarnings = Math.max(0, seIncome) * taxData.payroll.selfEmploymentNetEarningsFactor;
    const base = taxData.payroll.socialSecurityWageBase;
    const wagesForSeSsCap =
        filingStatus === "marriedJoint" ? wageIncomeSpouse1(inputs) : wageIncome(inputs);
    const ssRoom = Math.max(0, base - Math.min(Math.max(0, wagesForSeSsCap), base));
    const ssTaxable = Math.min(netEarnings, ssRoom);
    const ssTax = ssTaxable * taxData.payroll.selfEmploymentSocialSecurityRate;
    const medicareTax = netEarnings * taxData.payroll.selfEmploymentMedicareRate;
    return ssTax + medicareTax;
}

export function calculateSelfEmploymentDeduction(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    return calculateSelfEmploymentTax(inputs, taxData, filingStatus) / 2;
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
    const totalItemizedValue = totalItemized(inputs);
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
    return calculatePayrollTax(inputs, taxData, filingStatus) + calculateSelfEmploymentTax(inputs, taxData, filingStatus);
}

export const ordinaryIncomeAfterPretax = (inputs: TaxFormRow[]): number => {
    return Math.max(0, ordinaryIncome(inputs) - allPretax(inputs));
}

export const taxableIncomeAfterDeductions = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number => {
    const payrollTaxTotalValue = payrollTaxTotal(inputs, taxData, filingStatus);
    const deduction = getDeductionsWithoutPayrollTax(inputs, taxData, filingStatus);
    return Math.max(0, ordinaryIncomeAfterPretax(inputs) - payrollTaxTotalValue - deduction);
}


export function totalTaxableIncome(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus
): number {
    
    const ordinary = taxableIncomeAfterDeductions(inputs, taxData, filingStatus);
    const ltcg = longTermCapGains(inputs);
    return ordinary + ltcg;
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

type TaxBucket = {
    taxBracket?: FederalTaxBracket;
    type: string;
    tax: number;
    keep: number;
    credits: number;
    payrollTax: number;
    remainingIncome: number;
}
const bucketCache = new Map<string, TaxBucket[]>();

export function calculateTaxBuckets(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): Array<TaxBucket> {
    const cacheKey = JSON.stringify({ inputs, taxData, filingStatus });
    const cached = bucketCache.get(cacheKey);
    if (cached) {return cached};
    const result: Array<TaxBucket> = [];
    const brackets = taxData.federalBrackets[filingStatus];
    const income = ordinaryIncome(inputs) - allPretax(inputs);
    const payrollTaxTotal =
        calculatePayrollTax(inputs, taxData, filingStatus) + calculateSelfEmploymentTax(inputs, taxData, filingStatus);
    const deductions = totalDeductions(inputs, taxData, filingStatus);
    let remainingIncome = income - deductions;
    const ordinaryTaxableForLtcg = Math.max(0, remainingIncome);
    let remainingPayrollTax = Math.max(payrollTaxTotal - deductions, 0);
    let remainingCredits = totalCredits(inputs, taxData);
    result.push({ type: "tax-free", taxBracket: undefined, tax: 0, keep: deductions, credits: 0, payrollTax: 0, remainingIncome: remainingIncome });
    let previousBracketCeiling = 0;
    // loop through all brackets to calculate the tax and keep
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const cumulativeTop = bracket?.upTo ?? Number.POSITIVE_INFINITY;
        const sliceCap = Math.max(0, cumulativeTop - previousBracketCeiling);
        const taxableBracketIncome = Math.min(remainingIncome, sliceCap);
        remainingIncome = Math.max(0, remainingIncome - taxableBracketIncome);
        previousBracketCeiling = bracket?.upTo ?? previousBracketCeiling;
        const tax = taxableBracketIncome * bracket.rate;
        const keep = Math.max(taxableBracketIncome - tax - remainingPayrollTax, 0);
        remainingPayrollTax = Math.max(0, remainingPayrollTax - (taxableBracketIncome - tax));
        result.push({ type: "ordinary", taxBracket: bracket, tax, keep, credits: 0, payrollTax: remainingPayrollTax, remainingIncome: remainingIncome });
    }
    // adding in the LTCG tax path
    const ltcg = longTermCapGains(inputs);
    const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinaryTaxableForLtcg);
    result.push({ type: 'ltcg', tax: ltcgTax, keep: ltcg - ltcgTax, credits: 0, payrollTax: 0, remainingIncome: 0 });

    // loop thorough backwards and add in the credit calculations using result from the forward pass
    for (let i = result.length - 1; i >= 0; i--) {
        const bracket = result[i];
        const credits = Math.min(remainingCredits, bracket.tax);
        bracket.credits = Math.max(0, credits);
        bracket.tax = Math.max(0, bracket.tax - credits);
        remainingCredits -= credits;
    }
    console.log("calculateTaxBuckets", result);
    bucketCache.set(cacheKey, result);
    return result;
}