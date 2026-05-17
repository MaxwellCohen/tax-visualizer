import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { TaxFormRow } from "~/lib/tax/form/types";
import type { ValidationContext, YearValues } from "~/lib/config/types";

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

export type SankeyNode = {
    row: number;
    col: number;
};

export type SankeyLink = {
    source: string;
    target: string;
} & SankeyNode;


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

export type CalculateFn = (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => number;

/** Identity + copy shown in UI tooltips */
export type ConfigItemIdentity = {
    id: string;
    labels: ConfigLabels;
    description?: string;
    kindDetail?: KindDetail;
};

/** Line-item input slice (when this registry row backs the form) */
export type ConfigItemTaxInputSlice = {
    category?: InputCategory;
    input?: InputRowSettings;
    taxTreatment?: TaxTreatment;
};

/** Chart / summary presentation slice */
export type ConfigItemChartSlice = {
    chartRole?: ChartRole;
    chartStyle?: ChartStyle;
    sankey?: SankeySettings;
    mekko?: MekkoSettings;
    summary?: SummarySettings;
};

/** Numeric pipeline step */
export type ConfigItemPipelineSlice = {
    calculate?: CalculateFn;
};

/** One registry row: composed slices for shallower imports at chart vs input call sites */
export type ConfigItem = ConfigItemIdentity & ConfigItemTaxInputSlice & ConfigItemChartSlice & ConfigItemPipelineSlice;

