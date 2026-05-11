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

/** Cap from {@link YearValues.caps.credits} (e.g. saver's credit entry limit). */
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
