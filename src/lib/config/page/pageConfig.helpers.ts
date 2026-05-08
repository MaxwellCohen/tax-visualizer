import type { FilingStatus, TaxYearConfig, LongTermCapGainsThresholds, FederalTaxBracket } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { ValidationContext } from "../types";
import { standardDeduction as standardDeductionInput, useItemizedDeductions } from "./pageConfig.inputs";
import { computeDeductionShieldSlice } from "./taxCalculations";

type ValidationResult = {
    valid: boolean;
    message?: string;
    clampedValue?: number;
};

export type ValidationFn = (value: number, ctx: ValidationContext) => ValidationResult;

export const nonNegativeValidator: ValidationFn = (value: number, _ctx: ValidationContext) => {
    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
    return { valid: true };
};

export const makeCappedValidator = (getLimit: (ctx: ValidationContext) => number): ValidationFn => {
    return (value: number, ctx: ValidationContext) => {
        if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
        const limit = getLimit(ctx);
        if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
        return { valid: true };
    };
};

export const standardCappedValidator: ValidationFn = (value: number, ctx: ValidationContext) => {
    const limit = ctx.yearValues.limits["401k"] ?? 23000;
    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
    return { valid: true };
};

export const makeYearValuesCappedValidator = (
    key: string,
    fallback: number
): ValidationFn => {
    return (value: number, ctx: ValidationContext) => {
        const limit = ctx.yearValues.limits[key] ?? fallback;
        if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
        if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
        return { valid: true };
    };
};

export const makeFilingStatusCappedValidator = (
    key: string,
    fallbackSelf: number,
    fallbackJoint: number
): ValidationFn => {
    return (value: number, ctx: ValidationContext) => {
        const limit = ctx.isJoint
            ? (ctx.yearValues.limits[key] ?? fallbackJoint)
            : (ctx.yearValues.limits[key] ?? fallbackSelf);
        if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
        if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
        return { valid: true };
    };
};

export const makeSaltCappedValidator: ValidationFn = (value: number, ctx: ValidationContext) => {
    const limit = ctx.yearValues.caps.salt[ctx.filingStatus] ?? 10000;
    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
    return { valid: true };
};

export const makeHsaCappedValidator: ValidationFn = (value: number, ctx: ValidationContext) => {
    const isJoint = ctx.filingStatus === "marriedJoint";
    const limit = isJoint
        ? (ctx.yearValues.limits.hsaFamily ?? 8300)
        : (ctx.yearValues.limits.hsaSelfOnly ?? 4150);
    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
    return { valid: true };
};

export function findInputById(inputs: TaxFormRow[], id: string): number {
    const idLower = id.toLowerCase();
    let sum = 0;
    for (const row of (inputs || [])) {
        if (row.type === "setting") {
            if (row.id.toLowerCase().includes(idLower)) {
                if ("value" in row) {
                    const v = row.value;
                    if (typeof v === "number") return v;
                    if (typeof v === "boolean") return v ? 1 : 0;
                }
            }
        } else if ("kind" in row) {
            if (typeof row.kind === "string" && row.kind.toLowerCase().includes(idLower)) {
                if ("amount" in row && typeof row.amount === "number") {
                    sum += row.amount;
                }
            }
        }
    }
    return sum;
}

export function getStandardDeductionWithoutPayrollTax(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    if (useItemizedDeductions(inputs)) return 0;
    const standardDeductionValue = standardDeductionInput(inputs, taxData, filingStatus);
    const { payrollTaxTotal } = computeDeductionShieldSlice(inputs, taxData, filingStatus);
    return Math.max(0, standardDeductionValue - payrollTaxTotal);
}
export function getItemizedDeductionsWithoutPayrollTax(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    if (!useItemizedDeductions(inputs)) return 0;
    const { deduction, payrollTaxTotal } = computeDeductionShieldSlice(inputs, taxData, filingStatus);
    return Math.max(0, deduction - payrollTaxTotal);
}

export function getOrdinaryBrackets(taxData: TaxYearConfig, filingStatus: FilingStatus): FederalTaxBracket[] {
    return taxData.federalBrackets[filingStatus];
}

/** Row index for the credits Sankey band: below ordinary brackets (`bracketRow = 5 + i * 4`) and below LTCG (`ltcg-income` at row 50). */
const LTCG_SANKEY_INCOME_ROW = 50;
const CREDITS_SANKEY_PADDING = 2;

export function getCreditsSankeyRow(taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    const n = taxData.federalBrackets[filingStatus].length;
    const belowOrdinaryBrackets = 5 + n * 4 + CREDITS_SANKEY_PADDING;
    return Math.max(belowOrdinaryBrackets, LTCG_SANKEY_INCOME_ROW + CREDITS_SANKEY_PADDING);
}


export function calculateOrdinaryTaxTotal(taxableIncome: number, brackets: FederalTaxBracket[]): { tax: number; marginalRate: number } {
    let remaining = taxableIncome;
    let lowerBound = 0;
    let totalTax = 0;
    let lastRate = 0;

    for (const bracket of brackets) {
        if (remaining <= 0) break;
        const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
        const amountInBracket = Math.min(remaining, upperBound - lowerBound);
        if (amountInBracket > 0) {
            const taxAmount = amountInBracket * bracket.rate;
            totalTax += taxAmount;
            remaining -= amountInBracket;
            lastRate = bracket.rate;
        }
        lowerBound = upperBound;
    }
    return { tax: totalTax, marginalRate: lastRate };
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

    const thresholdValues = thresholds[filingStatus];
    const bracketConfigs: Array<{ rate: number; thresholdKey: "zeroRateMax" | "fifteenRateMax" | null }> = [
        { rate: 0, thresholdKey: "zeroRateMax" },
        { rate: 0.15, thresholdKey: "fifteenRateMax" },
        { rate: 0.20, thresholdKey: null },
    ];

    for (const cfg of bracketConfigs) {
        if (remaining <= 0) break;
        const upperBound = cfg.thresholdKey ? thresholdValues[cfg.thresholdKey] : Number.POSITIVE_INFINITY;
        const amountInBracket = Math.max(0, Math.min(remaining, Math.max(0, upperBound - lowerBound)));
        if (amountInBracket > 0) {
            const taxAmount = amountInBracket * cfg.rate;
            totalTax += taxAmount;
            remaining -= amountInBracket;
        }
        lowerBound = upperBound;
    }
    return totalTax;
}
