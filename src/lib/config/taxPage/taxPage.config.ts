import type { ValidationContext } from "~/lib/config/types";
import { getYearValues } from "~/lib/config/years/index";
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import { makeCreditInputsConfig } from "./inputConfigs/creditInputs";
import { makeDeductionInputsConfig, makePayrollTaxInputConfig } from "./inputConfigs/deductionInputs";
import { makeEndingNodesConfig } from "./nodes/endingNodes";
import { makeIncomeInputsConfig } from "./inputConfigs/incomeInputs";
import { makeIncomeNodesConfig } from "./nodes/incomeNodes";
import { makePretaxIncomeNodesConfig, makePretaxDeductionsNodesConfig } from "./nodes/pretaxNodes";
import { makeDeductionAmountNodesConfig, make0taxIncomeNodesConfig, makeMekkoSliceNodesConfig } from "./nodes/deductionNodes";
import { makePretaxInputsConfig } from "./inputConfigs/pretaxInputs";
import { getBracketItems } from "./nodes/taxBracketNodes";
import { makeTaxNodesConfig } from "./nodes/taxNodes";
import type {
    ConfigItem,
    InputCategory,
    InputRowSettings,
    TaxInputFormSectionDefinition,
    TaxInputFormSectionKey,
} from "./types";

/** Ordered tax input sections: edit this list to reorder or drop line-item groups; `settings` is special-cased in UI. */
const TAX_INPUT_FORM_SECTIONS: readonly TaxInputFormSectionDefinition[] = [
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
): ConfigItem[] {
    const def = TAX_INPUT_FORM_SECTIONS.find(
        (s): s is Extract<TaxInputFormSectionDefinition, { kind: "lineItems" }> =>
            s.key === sectionKey && s.kind === "lineItems",
    );
    if (!def) return [];
    const catSet = new Set<InputCategory>(def.categories);
    return getInputItems(taxData, filingStatus).filter(
        (item) => item.input?.category != null && catSet.has(item.input.category),
    );
}


/**
 * Full ordered registry of tax page {@link ConfigItem} rows (inputs + chart pipeline nodes).
 * Maintainer inventory: [docs/tax-config-items.md](../../../../docs/tax-config-items.md).
 */
export function getConfigItems(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    return [
        ...makeIncomeInputsConfig(taxData, filingStatus),
        ...makePretaxInputsConfig(taxData, filingStatus),
        ...makeDeductionInputsConfig(taxData, filingStatus),
        ...makePretaxDeductionsNodesConfig(taxData, filingStatus),
        ...makeCreditInputsConfig(taxData, filingStatus),
        ...makeIncomeNodesConfig(taxData, filingStatus),
        ...makeDeductionAmountNodesConfig(taxData, filingStatus),
        ...make0taxIncomeNodesConfig(taxData, filingStatus),
        ...makePayrollTaxInputConfig(taxData, filingStatus),
        ...makePretaxIncomeNodesConfig(taxData, filingStatus),
        ...makeTaxNodesConfig(taxData, filingStatus),
        ...makeMekkoSliceNodesConfig(taxData, filingStatus),
        ...getBracketItems(taxData, filingStatus),
        ...makeEndingNodesConfig(taxData, filingStatus),
    ];
}

export function getInputItems(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    return getConfigItems(taxData, filingStatus).filter((item) => "input" in item)
}

/** Build {@link ValidationContext} for `input.validate` on config items (limits from `YearValues`). */
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

/** Resolve `input.validate` for a line-item `kind` (subcategory key). */
function findValidateForKind(
    taxData: TaxYearConfig | null | undefined,
    filingStatus: FilingStatus,
    kind: string | undefined,
): NonNullable<InputRowSettings["validate"]> | undefined {
    return findInputItemForKind(taxData, filingStatus, kind)?.input?.validate;
}

/** Resolve the config item that owns a form row `kind` subcategory. */
export function findInputItemForKind(
    taxData: TaxYearConfig | null | undefined,
    filingStatus: FilingStatus,
    kind: string | undefined,
): ConfigItem | undefined {
    if (!taxData || kind == null) return undefined;
    return getInputItems(taxData, filingStatus).find((item) =>
        item.input?.subcategories?.some((sub) => sub.key === kind),
    );
}

/**
 * Runs the config object's `validate` for this kind. Rules live on {@link ConfigItem} `input` only
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


