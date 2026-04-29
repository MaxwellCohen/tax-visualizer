import type { FilingStatus, FederalTaxBracket, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import {
    calculateLtcgTaxTotal,
    getOrdinaryBrackets,
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
    allPretax,
    totalCredits,
    totalItemized,
    useItemizedDeductions,
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

function calculateSelfEmploymentTaxFromIncome(seIncome: number, taxData: TaxYearConfig): number {
    const netEarnings = seIncome * 0.9235;
    const ssTaxable = Math.min(netEarnings, taxData.payroll.socialSecurityWageBase);
    const ssTax = ssTaxable * taxData.payroll.socialSecurityRate * 2;
    const medicareTax = netEarnings * taxData.payroll.medicareRate * 2;
    return ssTax + medicareTax;
}

export function calculateSelfEmploymentDeduction(seIncome: number, taxData: TaxYearConfig): number {
    return calculateSelfEmploymentTaxFromIncome(seIncome, taxData) / 2;
}

export type TaxableIncomeResult = {
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
};

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
    const seIncome = selfEmploymentIncome(inputs);
    const seTax = calculateSelfEmploymentTaxFromIncome(seIncome, taxData);
    const seDeduction = seTax / 2;
    const pretax = allPretax(inputs);
    const afterPretax = ordinaryIncome(inputs) - pretax - seDeduction;
    /** Wage FICA + SE tax: modeled as carving out of the deduction shield before ordinary bracket income (matches Sankey / getStandardDeduction). */
    const payrollTaxTotal = calculatePayrollTax(inputs, taxData) + calculateSelfEmploymentTax(inputs, taxData);
    let deduction: number;
    let shieldCapBeforePayroll: number;
    if (useItemizedDeductions(inputs)) {
        shieldCapBeforePayroll = Math.min(totalItemized(inputs), afterPretax);
        deduction = Math.max(0, shieldCapBeforePayroll - payrollTaxTotal);
    } else {
        shieldCapBeforePayroll = Math.min(afterPretax, taxData.standardDeduction[filingStatus]);
        deduction = Math.max(0, shieldCapBeforePayroll - payrollTaxTotal);
    }
    const ordinary = Math.max(0, afterPretax - deduction);
    const payrollBracketShadowFill = Math.max(0, payrollTaxTotal - shieldCapBeforePayroll);
    const ltcg = longTermCapGains(inputs);
    return {
        ordinary,
        ltcg,
        total: ordinary + ltcg,
        afterPretax,
        deduction,
        payrollBracketShadowFill,
    };
}

/** Nonrefundable credits absorbed against federal income tax before credits (capped at gross federal tax). */
export function computeFederalTaxCreditsApplied(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): number {
    const credits = totalCredits(inputs);
    const { ordinary, ltcg, payrollBracketShadowFill } = calculateTaxableIncome(inputs, taxData, filingStatus);
    const brackets = getOrdinaryBrackets(taxData, filingStatus);
    const ordinaryTax = calculateOrdinaryTaxWithPayrollShadow(ordinary, brackets, payrollBracketShadowFill).tax;
    const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
    const totalTax = ordinaryTax + ltcgTax;
    return Math.min(credits, totalTax);
}

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
        const { ordinary, ltcg, payrollBracketShadowFill } = calculateTaxableIncome(inputs, taxData, filingStatus);
        const brackets = getOrdinaryBrackets(taxData, filingStatus);
        const ordinaryTax = calculateOrdinaryTaxWithPayrollShadow(ordinary, brackets, payrollBracketShadowFill).tax;
        const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
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
