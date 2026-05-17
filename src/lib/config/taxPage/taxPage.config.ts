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

type TaxPageRegistryPhase = {
    readonly name: string;
    readonly getItems: (taxData: TaxYearConfig, filingStatus: FilingStatus) => readonly ConfigItem[] | ConfigItem[];
};

/**
 * Ordered phases for {@link getConfigItems}. Names are asserted in tests against
 * [docs/tax-config-items.md](../../../../docs/tax-config-items.md) assembly order.
 */
const TAX_PAGE_REGISTRY_PHASES: readonly TaxPageRegistryPhase[] = [
    { name: "incomeInputs", getItems: makeIncomeInputsConfig },
    { name: "pretaxInputs", getItems: makePretaxInputsConfig },
    { name: "deductionInputs", getItems: makeDeductionInputsConfig },
    { name: "pretaxDeductionsNodes", getItems: makePretaxDeductionsNodesConfig },
    { name: "creditInputs", getItems: makeCreditInputsConfig },
    { name: "incomeNodes", getItems: makeIncomeNodesConfig },
    { name: "deductionAmountNodes", getItems: makeDeductionAmountNodesConfig },
    { name: "zeroTaxIncomeNodes", getItems: make0taxIncomeNodesConfig },
    { name: "payrollTaxInput", getItems: makePayrollTaxInputConfig },
    { name: "pretaxIncomeNodes", getItems: makePretaxIncomeNodesConfig },
    { name: "taxNodes", getItems: makeTaxNodesConfig },
    { name: "mekkoSliceNodes", getItems: makeMekkoSliceNodesConfig },
    { name: "bracketItems", getItems: getBracketItems },
    { name: "endingNodes", getItems: makeEndingNodesConfig },
] as const;

export const TAX_PAGE_REGISTRY_PHASE_NAMES = TAX_PAGE_REGISTRY_PHASES.map((p) => p.name);

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
    const out: ConfigItem[] = [];
    for (const phase of TAX_PAGE_REGISTRY_PHASES) {
        out.push(...phase.getItems(taxData, filingStatus));
    }
    return out;
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
        const r = fn(value, { ...ctx, lineItemKind: kind });
        if (!r.valid) return r.message ?? "Invalid amount";
        return undefined;
    }
    if (value < 0) return "Cannot be negative";
    return undefined;
}


