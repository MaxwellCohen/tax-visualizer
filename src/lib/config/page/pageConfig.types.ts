import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import { ValidationContext, YearValues } from "..";

type ValidationResult = {
    valid: boolean;
    message?: string;
    clampedValue?: number;
};

export type InputCategory = "income" | "pretax" | "deduction" | "credit";

/** Keys for the tax input UI; `settings` is not backed by `getInputItems` categories. */
export type TaxInputFormSectionKey = "settings" | InputCategory;

export type TaxInputFormSectionDefinition =
    | { key: "settings"; kind: "settings" }
    | { key: InputCategory; kind: "lineItems"; categories: readonly InputCategory[] };

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
    row: number;
    col: number;
};

export type SankeyNode = {
    row: number;
    col: number;
};

export type ChartRole =
    | "income"
    | "pretax"
    | "deduction"
    | "tax"
    | "credit"
    | "takehome"
    | "rate"
    | "keep"
    | "ltcg"
    | "seAdjustment"
    | "payrollTax"
    | "ordinaryBracket"
    | "default";

export type MekkoSegmentSplit = {
    keepId: string;
};

export type MekkoSettings = {
    row: number;
    col: number;
    split?: MekkoSegmentSplit;
};


export type TaxTreatment = "ordinary" | "selfEmployment" | "shortTermCapGains" | "longTermCapGains";

export type ConfigLabels = {
    default: string;
    compact?: string;
    summary?: string;
};

export type KindDetail = {
    modelingNote?: string;
    limitNote?: string;
};

export type ChartStyle = {
    fill?: string;
    stroke?: string;
};

export type SankeySettings = {
    node?: SankeyNode;
    links?: SankeyLink[];
};

export type SummarySettings = {
    displayOrder: number;
    format?: "currency" | "percent" | "number";
    highlight?: boolean;
    hideWhenZero?: boolean;
};

export type ConfigItem = {
    id: string;
    chartRole?: ChartRole;
    chartStyle?: ChartStyle;
    category?: InputCategory;
    labels: ConfigLabels;
    description?: string;
    kindDetail?: KindDetail;
    input?: InputRowSettings;
    taxTreatment?: TaxTreatment;
    sankey?: SankeySettings;
    mekko?: MekkoSettings;
    summary?: SummarySettings;
    calculate?: CalculateFn;
};

export type CalculateFn = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => number;

