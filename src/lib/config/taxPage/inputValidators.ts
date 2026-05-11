import type { ValidationContext } from "../types";

type ValidationResult = {
    valid: boolean;
    message?: string;
    clampedValue?: number;
};

type ValidationFn = (value: number, ctx: ValidationContext) => ValidationResult;

export const nonNegativeValidator: ValidationFn = (value: number, _ctx: ValidationContext) => {
    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
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

const electiveCatchUpKindToken = "electivecatchup";

/**
 * Caps 401(k)/403(b)/457(b) rows at the base elective limit, and age-50+ §402(g) catch-up rows at the catch-up limit.
 * Uses optional lineItemKind on the context (set when validating line items in the tax input form).
 */
export const makeElectiveDeferral401kFamilyRowValidator = (
    baseFallback: number,
    catchUpFallback: number,
): ValidationFn => {
    return (value: number, ctx: ValidationContext) => {
        const kind = (ctx.lineItemKind ?? "").toLowerCase();
        const base = ctx.yearValues.limits.electiveDeferral401k ?? baseFallback;
        const catchUp = ctx.yearValues.limits.electiveDeferral401kCatchUp ?? catchUpFallback;
        const limit = kind.includes(electiveCatchUpKindToken) ? catchUp : base;
        if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
        if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
        return { valid: true };
    };
};

/** Cap from yearValues.caps.credits (e.g. saver's credit entry limit). */
export const makeCreditsCappedValidator = (key: string, fallback: number): ValidationFn => {
    return (value: number, ctx: ValidationContext) => {
        const limit = ctx.yearValues.caps.credits[key] ?? fallback;
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
