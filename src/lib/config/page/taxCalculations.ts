import type { FilingStatus, FederalTaxBracket, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import {
    calculateLtcgTaxTotal,
    getOrdinaryBrackets,
} from "./pageConfig.helpers";
import {
    wageIncome,
    wageIncomeSpouse1,
    wageIncomeSpouse2,
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

export type PayrollTaxBreakdown = {
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
    const seIncome = selfEmploymentIncome(inputs);
    const netEarnings = seIncome * taxData.payroll.selfEmploymentNetEarningsFactor;
    const ssTaxable = Math.min(netEarnings, taxData.payroll.socialSecurityWageBase);
    const ssTax = ssTaxable * taxData.payroll.selfEmploymentSocialSecurityRate;
    const medicareTax = netEarnings * taxData.payroll.selfEmploymentMedicareRate;
    return ssTax + medicareTax;
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
    payrollTaxTotal: number;
    shieldCapBeforePayroll: number;
};

/** Single source for deduction shield cap, deduction dollars after payroll, ordinary taxable, and bracket shadow. */
export type DeductionShieldSlice = {
    afterPretax: number;
    shieldCapBeforePayroll: number;
    payrollTaxTotal: number;
    deduction: number;
    ordinary: number;
    payrollBracketShadowFill: number;
};

export function payrollTaxTotal(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    return calculatePayrollTax(inputs, taxData, filingStatus) + calculateSelfEmploymentTax(inputs, taxData);
}


export function computeDeductionShieldSlice(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
): DeductionShieldSlice {
    // Self-employment: full SE tax, then half is treated as deductible “employer share” when sizing the deduction shield base.
    const seIncome = selfEmploymentIncome(inputs);
    const seTax = calculateSelfEmploymentTaxFromIncome(seIncome, taxData);
    const seDeduction = seTax / 2;

    console.log("seIncome", seIncome);
    console.log("seTax", seTax);
    console.log("seDeduction", seDeduction);
    // Ordinary bucket (wages + SE + STCG, etc.) minus payroll pre-tax deferrals and the ½ SE adjustment → income the shield is measured against.
    const pretax = allPretax(inputs);
    console.log("pretax", pretax);
    const afterPretax = ordinaryIncome(inputs) - pretax - seDeduction;
    console.log("afterPretax", afterPretax);
    // Wage FICA plus full SE tax: both draw from the same deduction-shield capacity before ordinary taxable is left.
    const payrollTaxTotalValue = payrollTaxTotal(inputs, taxData, filingStatus);
    console.log("payrollTaxTotal", payrollTaxTotal);
    // Maximum dollars standard or itemized could shield from ordinary tax, capped by actual income after pretax/SE adjustment.
    const shieldCapBeforePayroll = useItemizedDeductions(inputs)
        ? Math.min(totalItemized(inputs), afterPretax)
        : Math.min(afterPretax, taxData.standardDeduction[filingStatus]);
    // Shield room left after payroll is allocated first (payroll “eats” the shield); remainder counts as deduction dollars in the Sankey.
    const deduction = Math.max(0, shieldCapBeforePayroll - payrollTaxTotalValue);
    // Income still exposed as ordinary taxable after the (post-payroll) deduction amount is applied.
    const ordinary = Math.max(0, afterPretax - deduction - payrollTaxTotalValue);
    // Payroll that exceeded the shield cap is modeled as consuming federal ordinary bracket width from the bottom (teaching visualization).
    const payrollBracketShadowFill = Math.max(0, payrollTaxTotalValue - shieldCapBeforePayroll);
    return {
        afterPretax,
        shieldCapBeforePayroll,
        payrollTaxTotal: payrollTaxTotalValue,
        deduction,
        ordinary,
        payrollBracketShadowFill,
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
    const credits = totalCredits(inputs);
    const { ordinary, ltcg, payrollBracketShadowFill } = calculateTaxableIncome(inputs, taxData, filingStatus);
    const brackets = getOrdinaryBrackets(taxData, filingStatus);
    const ordinaryTax = calculateOrdinaryTaxWithPayrollShadow(ordinary, brackets, payrollBracketShadowFill).tax;
    const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
    const totalTax = ordinaryTax + ltcgTax;
    return Math.min(credits, totalTax);
}

export function buildFinalTaxContext(taxData: TaxYearConfig, filingStatus: FilingStatus) {
    
    const calculatePayrollTaxFn = (inputs: TaxFormRow[], taxData: TaxYearConfig) => calculatePayrollTax(inputs, taxData, filingStatus)


    const calculateSelfEmploymentTax = (inputs: TaxFormRow[]): number => {
        const seIncome = selfEmploymentIncome(inputs);
        const netEarnings = seIncome * taxData.payroll.selfEmploymentNetEarningsFactor;
        const ssTaxable = Math.min(netEarnings, taxData.payroll.socialSecurityWageBase);
        const ssTax = ssTaxable * taxData.payroll.selfEmploymentSocialSecurityRate;
        const medicareTax = netEarnings * taxData.payroll.selfEmploymentMedicareRate;
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
