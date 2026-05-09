import type { FilingStatus, FederalTaxBracket, LongTermCapGainsThresholds, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
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
} from "./pageConfig.inputs";

export * from "./pageConfig.inputs";

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

export function getOrdinaryBrackets(taxData: TaxYearConfig, filingStatus: FilingStatus): FederalTaxBracket[] {
    return taxData.federalBrackets[filingStatus];
}

export function calculateLtcgTaxTotal(
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

type TaxableIncomeResult = {
    ordinary: number;
    ltcg: number;
    total: number;
    afterPretax: number;
    deduction: number;
    /**
     * Payroll + SE beyond the deduction-shield cap, modeled as consuming federal ordinary bracket
     * width from the bottom up before ordinary taxable fills each rate band (teaching flow).
     */
    payrollBracketShadowFill: number;
    payrollTaxTotal: number;
    shieldCapBeforePayroll: number;
};

/** Single source for deduction shield cap, deduction dollars after payroll, ordinary taxable, and bracket shadow. */
type DeductionShieldSlice = {
    afterPretax: number;
    shieldCapBeforePayroll: number;
    payrollTaxTotal: number;
    deduction: number;
    ordinary: number;
    payrollBracketShadowFill: number;
};

function payrollTaxTotal(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    return calculatePayrollTax(inputs, taxData, filingStatus) + calculateSelfEmploymentTax(inputs, taxData);
}

function computeDeductionShieldSlice(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): DeductionShieldSlice {
    const afterPretax = Math.max(0, ordinaryIncome(inputs) - allPretax(inputs));
    const shieldCapBeforePayroll = useItemizedDeductions(inputs)
        ? totalItemized(inputs)
        : standardDeductionInput(inputs, taxData, filingStatus);
    const payrollTaxTotalValue = payrollTaxTotal(inputs, taxData, filingStatus);
    const deduction = useItemizedDeductions(inputs)
        ? getItemizedDeductionsWithoutPayrollTax(inputs, taxData, filingStatus)
        : getStandardDeductionWithoutPayrollTax(inputs, taxData, filingStatus);

    return {
        afterPretax,
        shieldCapBeforePayroll,
        payrollTaxTotal: payrollTaxTotalValue,
        deduction,
        ordinary: Math.max(0, afterPretax - payrollTaxTotalValue - deduction),
        payrollBracketShadowFill: Math.max(0, payrollTaxTotalValue - shieldCapBeforePayroll),
    };
}


/**
 * Per-bracket ordinary dollars after `payrollBracketShadowFill` consumes width from the lowest
 * brackets first. The top (open-ended) bracket does not absorb shadow width.
 */
export function ordinaryIncomeSlicesWithPayrollShadow(
    ordinaryTaxable: number,
    brackets: readonly FederalTaxBracket[],
    payrollBracketShadowFill: number,
): number[] {
    let remainingShadow = Math.max(0, payrollBracketShadowFill);
    let remainingOrd = Math.max(0, ordinaryTaxable);
    const slices: number[] = [];
    let lowerBound = 0;
    for (const bracket of brackets) {
        const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
        const isOpenEnded = bracket.upTo == null;
        const width = isOpenEnded ? Number.POSITIVE_INFINITY : upperBound - lowerBound;
        const shadowHere = isOpenEnded ? 0 : Math.min(width, remainingShadow);
        remainingShadow -= shadowHere;
        const roomForOrdinary = width - shadowHere;
        const ordHere = Math.min(remainingOrd, roomForOrdinary);
        remainingOrd -= ordHere;
        slices.push(ordHere);
        lowerBound = upperBound;
    }
    return slices;
}

export function calculateOrdinaryTaxWithPayrollShadow(
    ordinaryTaxable: number,
    brackets: readonly FederalTaxBracket[],
    payrollBracketShadowFill: number,
): { tax: number; marginalRate: number; slices: number[] } {
    const slices = ordinaryIncomeSlicesWithPayrollShadow(ordinaryTaxable, brackets, payrollBracketShadowFill);
    let tax = 0;
    let marginalRate = 0;
    for (let i = 0; i < brackets.length; i++) {
        tax += slices[i] * brackets[i].rate;
        if (slices[i] > 0) {
            marginalRate = brackets[i].rate;
        }
    }
    return { tax, marginalRate, slices };
}

export function calculateTaxableIncome(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus
): TaxableIncomeResult {
    const slice = computeDeductionShieldSlice(inputs, taxData, filingStatus);
    const ltcg = longTermCapGains(inputs);
    return {
        ordinary: slice.ordinary,
        ltcg,
        total: slice.ordinary + ltcg,
        afterPretax: slice.afterPretax,
        deduction: slice.deduction,
        shieldCapBeforePayroll: slice.shieldCapBeforePayroll,
        payrollTaxTotal: slice.payrollTaxTotal,
        payrollBracketShadowFill: slice.payrollBracketShadowFill,
    };
}

/**
 * Dollars that flow into the `ordinaryTaxableIncome` Sankey hub so ribbons conserve: payroll + SE,
 * plus deduction ribbon (same {@link computeDeductionShieldSlice} as taxable income), plus ordinary
 * bracket slices.
 */
export function sankeyOrdinaryTaxableIncomeHubInflow(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {

    // return inputs.filter((row): row is TaxFormIncomeRow => row.type === "income" && row.type.startsWith("income-ordinary-")).reduce((acc, row) => acc + (row?.amount ?? 0), 0);
    const slice = computeDeductionShieldSlice(inputs, taxData, filingStatus);
    return slice.payrollTaxTotal + slice.deduction + slice.ordinary;
}

/** Nonrefundable credits absorbed against federal income tax before credits (capped at gross federal tax). */
export function computeFederalTaxCreditsApplied(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    const credits = totalCredits(inputs, taxData);
    const { ordinary, ltcg, payrollBracketShadowFill } = calculateTaxableIncome(inputs, taxData, filingStatus);
    const brackets = getOrdinaryBrackets(taxData, filingStatus);
    const ordinaryTax = calculateOrdinaryTaxWithPayrollShadow(ordinary, brackets, payrollBracketShadowFill).tax;
    const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
    const totalTax = ordinaryTax + ltcgTax;
    return Math.min(credits, totalTax);
}



export function calculateTaxBrackets(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) {
    const result = [];
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
        result.push({ taxBracket: bracket, tax, keep, credits: 0, payrollTax: remainingPayrollTax, remainingIncome: remainingIncome });
    };
     // adding in the LTCG tax path
     const ltcg = longTermCapGains(inputs);
     const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, income);
     result.push({  tax: ltcgTax, keep: ltcg - ltcgTax, credits: 0, payrollTax: 0, remainingIncome: 0 });

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