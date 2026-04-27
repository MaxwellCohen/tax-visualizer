import type { ValidationContext } from "~/lib/config/types";
import { getYearValues } from "~/lib/config/yearValues";
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import { makeCreditInputsConfig } from "./creditInputs";
import { makeDeductionInputsConfig, makePayrollFromWagesInputConfig, makePayrollTaxInputConfig } from "./deductionInputs";
import { makeEndingNodesConfig } from "./endingNodes";
import { makeIncomeInputsConfig } from "./incomeInputs";
import {
    makeDeductionAmountNodesConfig,
    makeIncomeNodesConfig,
    makePretaxIncomeNodesConfig,
    makePretaxDeductionsNodesConfig,
    make0taxIncomeNodesConfig,
    makeMekkoSliceNodesConfig,
} from "./incomeNodes";
import { makePretaxInputsConfig } from "./pretaxInputs";
import { getBracketItems, getLtcgBracketItems } from "./taxBracketNodes";
import { makeTaxNodesConfig } from "./taxNodes";
import type {
    configItem,
    InputCategory,
    InputRowSettings,
    TaxInputFormSectionDefinition,
    TaxInputFormSectionKey,
} from "./pageConfig.types";

export type {
    SankeyLink,
    configItem,
    TaxInputFormSectionDefinition,
    TaxInputFormSectionKey,
} from "./pageConfig.types";

/** Ordered tax input sections: edit this list to reorder or drop line-item groups; `settings` is special-cased in UI. */
export const TAX_INPUT_FORM_SECTIONS: readonly TaxInputFormSectionDefinition[] = [
    { key: "settings", kind: "settings" },
    { key: "income", kind: "lineItems", categories: ["income"] },
    { key: "pretax", kind: "lineItems", categories: ["pretax"] },
    { key: "deduction", kind: "lineItems", categories: ["deduction"] },
    { key: "credit", kind: "lineItems", categories: ["credit"] },
] as const;

export function getInputItemsForSection(
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
    sectionKey: Exclude<TaxInputFormSectionKey, "settings">,
): configItem[] {
    const def = TAX_INPUT_FORM_SECTIONS.find(
        (s): s is Extract<TaxInputFormSectionDefinition, { kind: "lineItems" }> =>
            s.key === sectionKey && s.kind === "lineItems",
    );
    if (!def) return [];
    const catSet = new Set<InputCategory>(def.categories);
    return getInputItems(taxData, filingStatus).filter(
        (item) => item.inputRowSettings?.category != null && catSet.has(item.inputRowSettings.category),
    );
}


export function getConfigItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        ...makeIncomeInputsConfig(taxData, filingStatus),
        ...makePretaxInputsConfig(taxData, filingStatus),
        ...makeDeductionInputsConfig(taxData, filingStatus),
        ...makePretaxDeductionsNodesConfig(taxData, filingStatus),
        ...makeCreditInputsConfig(taxData, filingStatus),
        ...makeIncomeNodesConfig(taxData, filingStatus),
        ...makeDeductionAmountNodesConfig(taxData, filingStatus),
        ...makePayrollFromWagesInputConfig(taxData, filingStatus),
        ...make0taxIncomeNodesConfig(taxData, filingStatus),
        ...makePayrollTaxInputConfig(taxData, filingStatus),
        ...makePretaxIncomeNodesConfig(taxData, filingStatus),
        ...makeTaxNodesConfig(taxData, filingStatus),
        ...makeMekkoSliceNodesConfig(taxData, filingStatus),
        ...getBracketItems(taxData, filingStatus),
        ...getLtcgBracketItems(taxData, filingStatus),
        ...makeEndingNodesConfig(taxData, filingStatus),
    ];
}

export function getInputItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return getConfigItems(taxData, filingStatus).filter((item) => 'inputRowSettings' in item)
}

/** Build {@link ValidationContext} for `inputRowSettings.validate` on config items (limits from `YearValues`). */
export function buildValidationContext(
    taxYear: number,
    filingStatus: FilingStatus,
): ValidationContext | undefined {
    const yearValues = getYearValues(taxYear);
    if (!yearValues) return undefined;
    return {
        yearValues,
        filingStatus,
        taxYear,
        isJoint: filingStatus === "marriedJoint",
    };
}

/** Resolve `inputRowSettings.validate` for a line-item `kind` (subcategory key). */
function findValidateForKind(
    taxData: TaxYearConfig | null | undefined,
    filingStatus: FilingStatus,
    kind: string | undefined,
): NonNullable<InputRowSettings["validate"]> | undefined {
    if (!taxData || kind == null) return undefined;
    for (const item of getInputItems(taxData, filingStatus)) {
        const s = item.inputRowSettings;
        if (!s?.validate) continue;
        const subs = s.subcategories;
        if (subs?.some((sub) => sub.key === kind)) {
            return s.validate;
        }
    }
    return undefined;
}

/**
 * Runs the config object's `validate` for this kind. Rules live on {@link configItem} `inputRowSettings` only
 * (see `incomeInputs`, `pretaxInputs`, `deductionInputs`, `creditInputs`).
 */
export function validateLineItemAmount(
    kind: string | undefined,
    value: number,
    ctx: ValidationContext | undefined,
    taxData: TaxYearConfig | null | undefined,
): string | undefined {
    if (kind == null || !ctx) return undefined;
    if (!Number.isFinite(value)) return "Enter a valid number";
    const fn = findValidateForKind(taxData, ctx.filingStatus, kind);
    if (fn) {
        const r = fn(value, ctx);
        if (!r.valid) return r.message ?? "Invalid amount";
        return undefined;
    }
    if (value < 0) return "Cannot be negative";
    return undefined;
}


