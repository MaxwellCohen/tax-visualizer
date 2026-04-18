import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import { ValidationContext, YearValues } from "..";

type ValidationResult = {
    valid: boolean;
    message?: string;
    clampedValue?: number;
};

export type InputCategory = "income" | "pretax" | "deduction" | "credit";

export type SubcategoryConfig = {
    key: string;
    labelSingle: string;
    labelJoint: string;
};

export type InputRowSettings = {
    category?: InputCategory;
    displayOrder: number;
    inputType: "currency" | "text";
    subcategories?: SubcategoryConfig[];
    defaultAmount?: number;
    defaultLabel?: string;
    getLimit?: (yearValues: YearValues) => number;
    getFilingStatusLimit?: (yearValues: YearValues, filingStatus: FilingStatus) => number;
    validate?: (value: number, ctx: ValidationContext) => ValidationResult;
    showWhen?: (ctx: { filingStatus: FilingStatus; taxYear: number; isJoint?: boolean }) => boolean;
};

export type SankeyLink = {
    source: string;
    target: string;
    fill: string;
    stroke: string;
    row: number;
    col: number;
};

export type SankeyNode = {
    row: number;
    col: number;
    fill: string;
    stroke: string;
};

export type MekkoColumn = {
    row: number;
    col: number;
    fill: string;
    stroke: string;
    kind: "deduction" | "pretax" | "seAdjustment" | "payrollTax" | "ordinaryBracket" | "ltcgBracket";
};

export type SankeyCategory = "income" | "pretax" | "deduction" | "tax" | "credit" | "summary" | "takehome" | "rate";

export type TaxTreatment = "ordinary" | "selfEmployment" | "shortTermCapGains" | "longTermCapGains";

export type configItem = {
    id: string;
    category?: InputCategory;
    label: string;
    shortLabel?: string;
    description?: string;
    kindDetail?: {
        modelingNote?: string;
        limitNote?: string;
    };
    inputRowSettings?: InputRowSettings;
    taxTreatment?: TaxTreatment;
    sankeySettings?: {
        node?: SankeyNode;
    } | {
        link?: SankeyLink[];
    };
    mekkoSettings?: {
        column?: MekkoColumn;
    };
    summary?: {
        summaryId: string;
        label: string;
        category: SankeyCategory;
        displayOrder: number;
        format?: "currency" | "percent" | "number";
        highlight?: boolean;
        hideWhenZero?: boolean;
    };
    detailedDisplay?: {
        order: number;
        type: string;
        category: SankeyCategory;
        format?: "currency" | "percent" | "number";
        label?: string;
        tooltip?: string;
        color?: string;
        highlight?: boolean;
    };
    calculate?: (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => number;
};

export function findItemById(items: configItem[], id: string): configItem | undefined {
    return items.find((i) => i.id === id);
}
