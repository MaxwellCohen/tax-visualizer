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
    fill?: string;
    stroke?: string;
    row: number;
    col: number;
} & ChartStyle;

export type SankeyNode = {
    row: number;
    col: number;
} & ChartStyle;

export type MekkoRowKind = "deduction" | "pretax" | "seAdjustment" | "payrollTax" | "ordinaryBracket" | "ltcgBracket";

export type MekkoSegmentSplit = {
    keepId: string;
    taxFill?: string;
    taxStroke?: string;
    taxColorRole?: ChartColorRole;
};

export type MekkoRowSettings = {
    row: number;
    col: number;
    kind: MekkoRowKind;
    split?: MekkoSegmentSplit;
} & ChartStyle;

export type SankeyCategory = "income" | "pretax" | "deduction" | "tax" | "credit" | "summary" | "takehome" | "rate";

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

export type ChartColorRole = "income" | "pretax" | "deduction" | "tax" | "credit" | "keep" | "ltcg" | "default";

export type ChartStyle = {
    colorRole?: ChartColorRole;
    fill?: string;
    stroke?: string;
};

export type SankeySettings = {
    node?: SankeyNode;
    links?: SankeyLink[];
};

export type MekkoSettings = {
    row?: MekkoRowSettings;
};

export type SummarySettings = {
    summaryId: string;
    category: SankeyCategory;
    displayOrder: number;
    format?: "currency" | "percent" | "number";
    highlight?: boolean;
    hideWhenZero?: boolean;
};

export type ConfigItem = {
    id: string;
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

