import type { FilingStatus, TaxYearConfig, LongTermCapGainsThresholds, FederalTaxBracket } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { LtcgTaxSegment } from "~/lib/taxCalc.types";
import { ValidationContext, YearValues } from "..";
import { LTCG_BRACKET_CONFIGS } from "../yearValues";

type ValidationResult = {
    valid: boolean;
    message?: string;
    clampedValue?: number;
};

export type InputRowSettings = {
    displayOrder: number;
    inputType: "currency" | "text";
    defaultAmount?: number;
    defaultLabel?: string;
    getLimit?: (yearValues: YearValues) => number;
    getFilingStatusLimit?: (yearValues: YearValues, filingStatus: FilingStatus) => number;
    validate?: (value: number, ctx: ValidationContext) => ValidationResult;
    showWhen?: (ctx: { filingStatus: FilingStatus; taxYear: number; isJoint?: boolean }) => boolean;
    getSpouseLabels?: (isJoint: boolean) => { single: string; joint: string; spouse1?: string; spouse2?: string };
};

export type SankeyLink = {
    source: string;
    target: string;
    fill: string;
    stroke: string;
};

export type SankeyNode = {
    fill: string;
    stroke: string;
};

export type SankeyCategory = "income" | "pretax" | "deduction" | "tax" | "credit" | "summary";

export type TaxTreatment = "ordinary" | "selfEmployment" | "shortTermCapGains" | "longTermCapGains";

export type configItem = {
    id: string;
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
    }
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

function findInputById(inputs: TaxFormRow[], id: string): number {
    const kindToIdMap: Record<string, string> = {
        "wages": "wages",
        "ordinary": "ordinary",
        "shortTermCapGains": "shortTermCapGains",
        "longTermCapGains": "longTermCapGains",
        "selfEmployment": "selfEmployment",
        "401k": "preTax401kSpouse1",
        "hsa": "preTaxHsaSpouse1",
        "otherPretax": "preTaxOther",
        "traditionalIra": "traditionalIraSpouse1",
    };

    const lookupId = kindToIdMap[id] ?? id;

    for (const row of inputs) {
        if (row.type === "setting") {
            if (row.id === id) {
                if ("value" in row && typeof row.value === "number") return row.value;
            }
        } else if ("kind" in row) {
            if (row.kind === lookupId) {
                if ("amount" in row && typeof row.amount === "number") {
                    return row.amount;
                }
            }
        }
    }
    return 0;
}


function getStandardDeduction(taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    return taxData.standardDeduction[filingStatus];
}

function getOrdinaryBrackets(taxData: TaxYearConfig, filingStatus: FilingStatus): FederalTaxBracket[] {
    return taxData.federalBrackets[filingStatus];
}

function calculateOrdinaryTaxTotal(taxableIncome: number, brackets: FederalTaxBracket[]): { tax: number; marginalRate: number } {
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

function calculateLtcgTaxTotal(
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

function makeIncomeInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "input-wages",
            label: "W-2 Wages",
            shortLabel: "Wages",
            description: "Wages reported on Form W-2",
            taxTreatment: "ordinary",
            inputRowSettings: { displayOrder: 1, inputType: "currency" },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "input-wages", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "input-selfEmployment",
            label: "1099 Self-Employment",
            shortLabel: "1099 Income",
            description: "Self-employment income (net of expenses)",
            taxTreatment: "selfEmployment",
            inputRowSettings: { displayOrder: 2, inputType: "currency" },
            sankeySettings: {
                link: [
                    { source: "input-selfEmployment", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "input-shortTermCapGains",
            label: "Short-Term Capital Gains",
            shortLabel: "STCG",
            description: "Capital gains held one year or less",
            taxTreatment: "shortTermCapGains",
            inputRowSettings: { displayOrder: 3, inputType: "currency" },
            sankeySettings: {
                link: [
                    { source: "input-shortTermCapGains", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "input-longTermCapGains",
            label: "Long-Term Capital Gains",
            shortLabel: "LTCG",
            description: "Capital gains held longer than one year",
            taxTreatment: "longTermCapGains",
            inputRowSettings: { displayOrder: 4, inputType: "currency" },
            sankeySettings: {
                link: [
                    { source: "input-longTermCapGains", target: "longTermCapGains", fill: "var(--sankey-link-ltcg)", stroke: "var(--sankey-link-ltcg)" },
                ],
            },
        },
        {
            id: "input-ordinary",
            label: "Other Ordinary Income",
            shortLabel: "Other Income",
            description: "Other ordinary income (rent, royalties, etc.)",
            taxTreatment: "ordinary",
            inputRowSettings: { displayOrder: 5, inputType: "currency" },
            sankeySettings: {
                link: [
                    { source: "input-ordinary", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
    ];
}

function makePretaxInputsConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "input-401k",
            label: "401(k) Deferrals",
            shortLabel: "401(k)",
            description: "Elective deferrals from W-2 pay",
            kindDetail: {
                limitNote: "elective deferral per employee (catch-up not modeled)",
            },
            inputRowSettings: {
                displayOrder: 1,
                inputType: "currency",
                getLimit: (yearValues) => yearValues.limits["401k"] ?? 23000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.limits["401k"] ?? 23000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
                getSpouseLabels: () => ({ single: "401(k) deferrals", joint: "401(k) deferrals — Spouse 1", spouse1: "401(k) — Spouse 1", spouse2: "401(k) — Spouse 2" }),
            },
            sankeySettings: {
                link: [
                    { source: "input-401k", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
        },
        {
            id: "hsa",
            label: "HSA (payroll)",
            shortLabel: "HSA",
            description: "Payroll HSA contributions",
            kindDetail: {
                limitNote: "payroll HSA contributions toward HDHP limits",
            },
            inputRowSettings: {
                displayOrder: 2,
                inputType: "currency",
                getFilingStatusLimit: (yearValues, filingStatus) => {
                    const isJoint = filingStatus === "marriedJoint";
                    return isJoint ? (yearValues.limits["hsaFamily"] ?? 8300) : (yearValues.limits["hsaSelfOnly"] ?? 4150);
                },
                validate: (value, ctx) => {
                    const isJoint = ctx.filingStatus === "marriedJoint";
                    const limit = isJoint ? (ctx.yearValues.limits["hsaFamily"] ?? 8300) : (ctx.yearValues.limits["hsaSelfOnly"] ?? 4150);
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
                showWhen: (ctx) => ctx.isJoint !== undefined,
                getSpouseLabels: () => ({ single: "HSA (payroll)", joint: "HSA (payroll) — Spouse 1", spouse1: "HSA — Spouse 1", spouse2: "HSA — Spouse 2" }),
            },
            sankeySettings: {
                link: [
                    { source: "hsa", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
        },
        {
            id: "otherPretax",
            label: "Other Pre-tax (payroll)",
            shortLabel: "Other Pre-tax",
            description: "Miscellaneous payroll amounts taken pre-tax",
            kindDetail: {
                limitNote: "miscellaneous payroll amounts taken pre-tax",
            },
            inputRowSettings: {
                displayOrder: 3,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                link: [
                    { source: "otherPretax", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
        },
        {
            id: "traditionalIra",
            label: "Traditional IRA (deductible)",
            shortLabel: "Traditional IRA",
            description: "Traditional IRA (deductible)",
            kindDetail: {
                limitNote: "Traditional IRA (deductible in this flow)",
            },
            inputRowSettings: {
                displayOrder: 4,
                inputType: "currency",
                getLimit: (yearValues) => yearValues.limits["traditionalIra"] ?? 7000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.limits["traditionalIra"] ?? 7000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
                showWhen: (ctx) => ctx.isJoint !== undefined,
                getSpouseLabels: () => ({ single: "Traditional IRA (deductible)", joint: "Traditional IRA — Spouse 1", spouse1: "Traditional IRA — Spouse 1", spouse2: "Traditional IRA — Spouse 2" }),
            },
            sankeySettings: {
                link: [
                    { source: "traditionalIra", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
        },
    ];
}

function makeDeductionInputsConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "standard",
            label: "Standard Deduction",
            shortLabel: "Standard",
            description: "Standard deduction based on filing status",
            kindDetail: {
                modelingNote: "Applied automatically if greater than itemized deductions",
            },
            inputRowSettings: { displayOrder: 1, inputType: "currency" },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "standard", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: () => taxData.standardDeduction[filingStatus],
        },
        {
            id: "salt",
            label: "State & Local Taxes (SALT)",
            shortLabel: "SALT",
            description: "State and local taxes you elect to deduct",
            kindDetail: {
                limitNote: "$10,000 cap (single) / $10,000 (married)",
            },
            inputRowSettings: {
                displayOrder: 2,
                inputType: "currency",
                getFilingStatusLimit: (yearValues, filingStatus) => yearValues.caps.salt[filingStatus] ?? 10000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.caps.salt[ctx.filingStatus] ?? 10000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "salt", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "medicalDental",
            label: "Medical & Dental",
            shortLabel: "Medical",
            description: "Medical and dental expenses (7.5% of AGI threshold applied at calculation)",
            kindDetail: {
                modelingNote: "Subject to 7.5% of AGI threshold",
            },
            inputRowSettings: {
                displayOrder: 3,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "medicalDental", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "mortgageInterest",
            label: "Home Mortgage Interest",
            shortLabel: "Mortgage",
            description: "Home mortgage interest",
            kindDetail: {
                modelingNote: "Limited to first $750k of acquisition debt (pre-2018: $1M)",
            },
            inputRowSettings: {
                displayOrder: 4,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "mortgageInterest", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "charitable",
            label: "Charitable Contributions",
            shortLabel: "Charity",
            description: "Cash and non-cash contributions to qualified charities",
            kindDetail: {
                limitNote: "60% of AGI limit for cash contributions",
            },
            inputRowSettings: {
                displayOrder: 5,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "charitable", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
    ];
}

function makeCreditInputsConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "childTaxCredit",
            label: "Child Tax Credit",
            shortLabel: "CTC",
            description: "Credit for qualifying children (up to $2000 per child)",
            kindDetail: {
                modelingNote: "$2000 per child, $500 refundable if greater than tax liability",
            },
            inputRowSettings: {
                displayOrder: 1,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
        },
        {
            id: "educationCredits",
            label: "Education Credits",
            shortLabel: "Education",
            description: "American opportunity credit and/or lifetime learning credit",
            kindDetail: {
                modelingNote: "AOC (up to $2500 per student) or LLC (up to $2000 per return)",
            },
            inputRowSettings: {
                displayOrder: 2,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
        },
        {
            id: "retirementSavingsContributions",
            label: "Retirement Savings Contributions (Saver's Credit)",
            shortLabel: "Saver's Credit",
            description: "Saver's credit for eligible retirement contributions",
            kindDetail: {
                limitNote: "Up to $2000 credit (based on income)",
            },
            inputRowSettings: {
                displayOrder: 3,
                inputType: "currency",
                getLimit: (yearValues) => yearValues.caps.credits["retirementSavingsContributions"] ?? 2000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.caps.credits["retirementSavingsContributions"] ?? 2000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
            },
        },
        {
            id: "otherFederalCredit",
            label: "Other Federal Credit",
            shortLabel: "Other",
            description: "Any other federal income tax credit",
            kindDetail: {
                modelingNote: "Miscellaneous federal credits",
            },
            inputRowSettings: {
                displayOrder: 4,
                inputType: "currency",
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
        },
    ];
}

function makeIncomeCalculationsConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {

    const wageIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "wages");
    const selfEmploymentIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "selfEmployment");
    const shortTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "shortTermCapGains");
    const longTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "longTermCapGains");
    const ordinaryIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "ordinary");

    const _401k = (inputs: TaxFormRow[]) => findInputById(inputs, "401k");
    const _hsa = (inputs: TaxFormRow[]) => findInputById(inputs, "hsa");
    const otherPretax = (inputs: TaxFormRow[]) => findInputById(inputs, "otherPretax");
    const traditionalIra = (inputs: TaxFormRow[]) => findInputById(inputs, "traditionalIra");

    const salt = (inputs: TaxFormRow[]) => findInputById(inputs, "salt");
    const medicalDental = (inputs: TaxFormRow[]) => findInputById(inputs, "medicalDental");
    const mortgageInterest = (inputs: TaxFormRow[]) => findInputById(inputs, "mortgageInterest");
    const charitable = (inputs: TaxFormRow[]) => findInputById(inputs, "charitable");

    const childTaxCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "childTaxCredit");
    const educationCredits = (inputs: TaxFormRow[]) => findInputById(inputs, "educationCredits");
    const retirementSavingsContributions = (inputs: TaxFormRow[]) => findInputById(inputs, "retirementSavingsContributions");
    const otherCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "otherFederalCredit");

    return [
        {
            id: "totalIncome",
            label: "Total Income",
            shortLabel: "Total Income",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
            },
            calculate: (inputs) => {
                return (
                    wageIncome(inputs) +
                    selfEmploymentIncome(inputs) +
                    shortTermCapGains(inputs) +
                    longTermCapGains(inputs) +
                    ordinaryIncome(inputs)
                );
            },
        },
        {
            id: "wages",
            label: "Wages",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "wages", target: "shieldedIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                    { source: "wages", target: "wagesAfterPretax", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: (inputs) => {
                return (
                    wageIncome(inputs) +
                    selfEmploymentIncome(inputs) +
                    shortTermCapGains(inputs) +
                    ordinaryIncome(inputs)
                );
            },
        },
        {
            id: "longTermCapGains",
            label: "Long-Term Capital Gains",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link-ltcg)" },
                link: [
                    { source: "longTermCapGains", target: "longTermTaxableIncome", fill: "var(--sankey-link-ltcg)", stroke: "var(--sankey-link-ltcg)" },
                ],
            },
            calculate: longTermCapGains,
        },
        {
            id: "pretaxIncome",
            label: "Pretax Deductions",
            shortLabel: "Pretax Deductions",
            sankeySettings: {
                link: [
                    { source: "pretaxIncome", target: "shieldedIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
            calculate: (inputs) => {
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                return pretax;
            },
        },
        {
            id: "selfEmployment",
            label: "Self-Employment Income",
            sankeySettings: {
                link: [
                    { source: "selfEmployment", target: "ordinaryTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: selfEmploymentIncome,
        },
        {
            id: "ordinaryIncome",
            label: "Other Ordinary Income",
            sankeySettings: {
                link: [
                    { source: "ordinaryIncome", target: "ordinaryTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: ordinaryIncome,
        },
        {
            id: "shortTermCapGains",
            label: "Short-Term Capital Gains",
            sankeySettings: {
                link: [
                    { source: "shortTermCapGains", target: "ordinaryTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: shortTermCapGains,
        },
        {
            id: "shortTermCapGainsGrossIncome",
            label: "Short-Term Cap Gains (Gross)",
            shortLabel: "STCG (Gross)",
            calculate: shortTermCapGains,
        },
        {
            id: "longTermCapitalGainsGrossIncome",
            label: "Long-Term Cap Gains (Gross)",
            shortLabel: "LTCG (Gross)",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)" },
            },
            calculate: longTermCapGains,
        },
        {
            id: "ordinaryGrossIncome",
            label: "Ordinary Gross Income",
            shortLabel: "Ordinary Gross",
            calculate: (inputs) => ordinaryIncome(inputs) + shortTermCapGains(inputs),
        },
        {
            id: "preTaxTotal",
            label: "Total Pre-tax",
            shortLabel: "Total Pre-tax",
            calculate: (inputs) => _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs),
        },
        {
            id: "preTax401k",
            label: "401(k)",
            shortLabel: "401(k)",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)" },
                link: [
                    { source: "preTax401k", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
            calculate: _401k,
        },
        {
            id: "preTaxHsa",
            label: "HSA",
            shortLabel: "HSA",
            sankeySettings: {
                link: [
                    { source: "preTaxHsa", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
            calculate: _hsa,
        },
        {
            id: "preTaxOther",
            label: "Other Pre-tax",
            shortLabel: "Other Pre-tax",
            sankeySettings: {
                link: [
                    { source: "preTaxOther", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
            calculate: otherPretax,
        },
        {
            id: "traditionalIra",
            label: "Traditional IRA",
            shortLabel: "Traditional IRA",
            sankeySettings: {
                link: [
                    { source: "traditionalIra", target: "pretaxIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
            calculate: traditionalIra,
        },
        {
            id: "wagesAfterPretax",
            label: "Wages After Pre-tax",
            shortLabel: "Wages After Pre-tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "wagesAfterPretax", target: "ordinaryTaxableIncome", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: (inputs) => wageIncome(inputs) - (_401k(inputs) + _hsa(inputs)),
        },
        {
            id: "shieldedIncome",
            label: "Shielded Income",
            shortLabel: "Shielded",
            sankeySettings: {
                node: { fill: "var(--sankey-node-deferred)", stroke: "var(--sankey-link-deferred)" },
                link: [
                    { source: "shieldedIncome", target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)" },
                ],
            },
            calculate: (inputs) => {
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                return pretax + deduction;
            },
        },
        {
            id: "deductionAmount",
            label: "Deduction Used",
            shortLabel: "Deduction Used",
            sankeySettings: {
                link: [
                    { source: "deductionAmount", target: "shieldedIncome", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
            calculate: (inputs) => {
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                return Math.max(itemized, standard);
            },
        },
        {
            id: "taxableIncomeAfterDeductions",
            label: "Taxable Income After Deductions",
            shortLabel: "Taxable After Ded.",
            sankeySettings: {
                node: { fill: "var(--sankey-node-3)", stroke: "var(--sankey-link)" },
            },
            calculate: (inputs) => {
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                return Math.max(0, afterPretax - deduction);
            },
        },
        {
            id: "ordinaryTaxableIncome",
            label: "Ordinary Income (Pre-Deduction)",
            shortLabel: "Ordinary (Pre-Ded)",
            sankeySettings: {
                node: { fill: "var(--sankey-node-3)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "ordinaryTaxableIncome", target: "deductionAmount", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: (inputs) => {
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                return afterPretax;
            },
        },
        {
            id: "longTermTaxableIncome",
            label: "LTCG Taxable Income",
            shortLabel: "LTCG Taxable",
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)" },
            },
            calculate: longTermCapGains,
        },
        {
            id: "taxableIncome",
            label: "Total Taxable Income",
            shortLabel: "Taxable Income",
            // sankeySettings: {
            //     node: { fill: "var(--sankey-node-5)", stroke: "var(--sankey-link)" },
            // },
            calculate: (inputs) => {
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                const ltcgTaxable = longTermCapGains(inputs);
                return ordinaryTaxable + ltcgTaxable;
            },
        },
        {
            id: "federalOrdinaryIncomeTax",
            label: "Federal Ordinary Tax",
            shortLabel: "Federal Ord. Tax",
            calculate: (inputs) => {
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                return calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
            },
        },
        {
            id: "federalLongTermCapGainsTax",
            label: "Federal LTCG Tax",
            shortLabel: "Federal LTCG Tax",
            calculate: (inputs) => {
                const ltcg = longTermCapGains(inputs);
                return calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, 0);
            },
        },
        {
            id: "federalNetInvestmentIncomeTax",
            label: "Net Investment Income Tax",
            shortLabel: "NIIT",
            calculate: (inputs) => {
                const investmentIncome = ordinaryIncome(inputs) + shortTermCapGains(inputs) + longTermCapGains(inputs);
                const modifiedAGI = wageIncome(inputs) + selfEmploymentIncome(inputs) + investmentIncome;
                const threshold = filingStatus === "marriedJoint" ? 250000 : 200000;
                if (modifiedAGI <= threshold) return 0;
                const niitBase = Math.max(0, investmentIncome - (modifiedAGI - threshold));
                return niitBase * 0.038;
            },
        },
        {
            id: "netInvestmentIncome",
            label: "Net Investment Income",
            shortLabel: "Investment Income",
            calculate: (inputs) => {
                return ordinaryIncome(inputs) + shortTermCapGains(inputs) + longTermCapGains(inputs);
            },
        },
        {
            id: "federalTaxCreditsApplied",
            label: "Federal Credits Applied",
            shortLabel: "Credits Applied",
            sankeySettings: {
                node: { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)" },
            },
            calculate: (inputs) => {
                const credits = childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);
                const afterPretax = wageIncome(inputs) + selfEmploymentIncome(inputs) + ordinaryIncome(inputs) + shortTermCapGains(inputs) - (_401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs));
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const ordinaryTax = calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
                const ltcgTax = calculateLtcgTaxTotal(longTermCapGains(inputs), taxData.longTermCapGains, filingStatus, 0);
                const totalTax = ordinaryTax + ltcgTax;
                return Math.min(credits, totalTax);
            },
        },
        {
            id: "socialSecurityTax",
            label: "Social Security Tax",
            shortLabel: "SS Tax",
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const ssTaxable = Math.min(wages, taxData.payroll.socialSecurityWageBase);
                return ssTaxable * taxData.payroll.socialSecurityRate;
            },
        },
        {
            id: "medicareTax",
            label: "Medicare Tax",
            shortLabel: "Medicare Tax",
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                return wages * taxData.payroll.medicareRate;
            },
        },
    ];
}

function getBracketItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const brackets = getOrdinaryBrackets(taxData, filingStatus);
    const items: configItem[] = [];

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const rateLabel = (bracket.rate * 100).toFixed(0);
        const bracketId = `bracket-${i}`;
        
        // Capture the prior bound as a const to close over
        const priorBound = (i > 0) ? (brackets[i - 1].upTo ?? Number.POSITIVE_INFINITY) : 0;
        
        console.log(`bracket-${i}: priorBound=${priorBound}, upTo=${bracket.upTo}`);

        const incomeCalculate = (inputs: TaxFormRow[], _td?: TaxYearConfig, _fs?: FilingStatus) => {
            const wages = findInputById(inputs, "wages");
            const seIncome = findInputById(inputs, "selfEmployment");
            const ordinary = findInputById(inputs, "ordinary");
            const stcg = findInputById(inputs, "shortTermCapGains");
            const pretax = findInputById(inputs, "401k") + findInputById(inputs, "hsa") + findInputById(inputs, "otherPretax") + findInputById(inputs, "traditionalIra");
            const afterPretax = wages + seIncome + ordinary + stcg - pretax;
            const itemized = findInputById(inputs, "salt") + findInputById(inputs, "medicalDental") + findInputById(inputs, "mortgageInterest") + findInputById(inputs, "charitable");
            const standard = getStandardDeduction(taxData, filingStatus);
            const deduction = Math.max(itemized, standard);
            const taxableIncome = Math.max(0, afterPretax - deduction);
            const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
            return Math.max(0, Math.min(taxableIncome, upperBound) - priorBound);
        };

        items.push({
            id: `${bracketId}-income`,
            label: `Bracket ${i + 1} Income (${rateLabel}%)`,
            shortLabel: `${rateLabel}% Income`,
            sankeySettings: {
                node: { fill: "var(--sankey-node-4)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "taxableIncomeAfterDeductions", target: `${bracketId}-income`, fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: incomeCalculate,
        });

        const incomeItem = items[items.length - 1];

        // Bracket Tax item - for calculation only, links to federalIncomeTax
        items.push({
            id: `${bracketId}-tax`,
            label: `Bracket ${i + 1} Tax (${rateLabel}%)`,
            shortLabel: `${rateLabel}% Tax`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                ],
            },
            calculate: (inputs, td, fs) => {
                const incomes = incomeItem.calculate?.(inputs, td, fs) ?? 0;
                return incomes * bracket.rate;
            },
        });

        // Bracket Keep item - for calculation only, links to takeHomePay
        items.push({
            id: `${bracketId}-keep`,
            label: `Bracket ${i + 1} Keep (${rateLabel}%)`,
            shortLabel: `${rateLabel}% Keep`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)" },
                ],
            },
            calculate: (inputs) => {
                const incomes = incomeItem.calculate?.(inputs, taxData, filingStatus) ?? 0;
                return incomes * (1 - bracket.rate);
            },
        });
    }

    return items;
}

function getLtcgBracketItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const longTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "longTermCapGains");
    const thresholds = taxData.longTermCapGains[filingStatus];
    const items: configItem[] = [];

    const ltcgConfigs: Array<{ rate: number; thresholdKey: "zeroRateMax" | "fifteenRateMax" | null; label: string }> = [
        { rate: 0, thresholdKey: "zeroRateMax", label: "0%" },
        { rate: 0.15, thresholdKey: "fifteenRateMax", label: "15%" },
        { rate: 0.20, thresholdKey: null, label: "20%" },
    ];

    let priorBound = 0;

    for (let i = 0; i < ltcgConfigs.length; i++) {
        const cfg = ltcgConfigs[i];
        const upperBound = cfg.thresholdKey ? (thresholds[cfg.thresholdKey] ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

        const incomeCalculate = (inputs: TaxFormRow[], _td?: TaxYearConfig, _fs?: FilingStatus) => {
            const ltcgAmount = longTermCapGains(inputs);
            const amountInBracket = Math.max(0, Math.min(ltcgAmount, upperBound) - priorBound);
            return amountInBracket;
        };

        const bracketId = `ltcg-bracket-${i}`;
        items.push({
            id: `${bracketId}-income`,
            label: `LTCG Bracket ${i + 1} Income (${cfg.label})`,
            shortLabel: `LTCG ${cfg.label} Income`,
            sankeySettings: {
                link: [
                    { source: "longTermTaxableIncome", target: `${bracketId}-income`, fill: "var(--sankey-link-ltcg)", stroke: "var(--sankey-link-ltcg)" },
                ],
            },
            calculate: incomeCalculate,
        });

        const incomeItem = items[items.length - 1];

        items.push({
            id: `${bracketId}-tax`,
            label: `LTCG Bracket ${i + 1} Tax (${cfg.label})`,
            shortLabel: `LTCG ${cfg.label} Tax`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                ],
            },
            calculate: (inputs, td, fs) => {
                const incomes = incomeItem.calculate?.(inputs, td, fs) ?? 0;
                return incomes * cfg.rate;
            },
        });

        items.push({
            id: `${bracketId}-keep`,
            label: `LTCG Bracket ${i + 1} Keep (${cfg.label})`,
            shortLabel: `LTCG ${cfg.label} Keep`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)" },
                ],
            },
            calculate: (inputs, td, fs) => {
                const incomes = incomeItem.calculate?.(inputs, td, fs) ?? 0;
                return incomes * (1 - cfg.rate);
            },
        });

        priorBound = upperBound;
    }

    return items;
}


function makeFinalTaxDestination(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const wageIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "wages");
    const selfEmploymentIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "selfEmployment");
    const ordinaryIncome = (inputs: TaxFormRow[]) => findInputById(inputs, "ordinary");
    const shortTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "shortTermCapGains");
    const longTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "longTermCapGains");

    const _401k = (inputs: TaxFormRow[]) => findInputById(inputs, "401k");
    const _hsa = (inputs: TaxFormRow[]) => findInputById(inputs, "hsa");
    const otherPretax = (inputs: TaxFormRow[]) => findInputById(inputs, "otherPretax");
    const traditionalIra = (inputs: TaxFormRow[]) => findInputById(inputs, "traditionalIra");

    const salt = (inputs: TaxFormRow[]) => findInputById(inputs, "salt");
    const medicalDental = (inputs: TaxFormRow[]) => findInputById(inputs, "medicalDental");
    const mortgageInterest = (inputs: TaxFormRow[]) => findInputById(inputs, "mortgageInterest");
    const charitable = (inputs: TaxFormRow[]) => findInputById(inputs, "charitable");

    const childTaxCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "childTaxCredit");
    const educationCredits = (inputs: TaxFormRow[]) => findInputById(inputs, "educationCredits");
    const retirementSavingsContributions = (inputs: TaxFormRow[]) => findInputById(inputs, "retirementSavingsContributions");
    const otherCredit = (inputs: TaxFormRow[]) => findInputById(inputs, "otherFederalCredit");

    const calculatePayrollTax = (inputs: TaxFormRow[]): number => {
        const wages = wageIncome(inputs);
        const ssTaxable = Math.min(wages, taxData.payroll.socialSecurityWageBase);
        const ssTax = ssTaxable * taxData.payroll.socialSecurityRate;
        const medicareTax = wages * taxData.payroll.medicareRate;
        return ssTax + medicareTax;
    };

    const calculateSelfEmploymentTax = (inputs: TaxFormRow[]): number => {
        const seIncome = selfEmploymentIncome(inputs);
        const netEarnings = seIncome * 0.9235;
        const ssTaxable = Math.min(netEarnings, taxData.payroll.socialSecurityWageBase);
        const ssTax = ssTaxable * taxData.payroll.socialSecurityRate * 2;
        const medicareTax = netEarnings * taxData.payroll.medicareRate * 2;
        return ssTax + medicareTax;
    };

    const calculateFederalIncomeTaxAfterCredits = (inputs: TaxFormRow[]): number => {
        const wages = wageIncome(inputs);
        const seIncome = selfEmploymentIncome(inputs);
        const ordinary = ordinaryIncome(inputs);
        const stcg = shortTermCapGains(inputs);
        const ltcg = longTermCapGains(inputs);
        const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
        const afterPretax = wages + seIncome + ordinary + stcg - pretax;
        const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
        const standard = getStandardDeduction(taxData, filingStatus);
        const deduction = Math.max(itemized, standard);
        const ordinaryTaxable = Math.max(0, afterPretax - deduction);
        const brackets = getOrdinaryBrackets(taxData, filingStatus);
        const ordinaryTax = calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
        const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, 0);
        const totalTax = ordinaryTax + ltcgTax;
        const credits = childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);
        return Math.max(0, totalTax - credits);
    };

    return [
        {
            id: "federalIncomeTaxBeforeCredits",
            label: "Fed Tax Before Credits",
            shortLabel: "Fed Tax Before Credits",
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const seIncome = selfEmploymentIncome(inputs);
                const ordinary = ordinaryIncome(inputs);
                const stcg = shortTermCapGains(inputs);
                const ltcg = longTermCapGains(inputs);
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const afterPretax = wages + seIncome + ordinary + stcg - pretax;
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const ordinaryTaxable = Math.max(0, afterPretax - deduction);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const ordinaryTax = calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
                const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, 0);
                return ordinaryTax + ltcgTax;
            },
        },
        {
            id: "federalTaxCredits",
            label: "Federal Tax Credits",
            shortLabel: "Credits",
            sankeySettings: {
                // node: { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)" },
                link: [
                    { source: "federalTaxCredits", target: "federalIncomeTax", fill: "var(--sankey-link-credits)", stroke: "var(--sankey-link-credits)" },
                ],
            },
            calculate: (inputs) => {
                return childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);
            },
        },
        {
            id: "federalIncomeTax",
            label: "Federal Income Tax",
            shortLabel: "Federal Income Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)" },
                link: [
                    // { source: "federalIncomeTax", target: "takeHomePay", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                ],
            },
            calculate: calculateFederalIncomeTaxAfterCredits,
        },
        {
            id: "payrollTax",
            label: "Payroll Taxes",
            shortLabel: "Payroll Taxes",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)" },
                link: [
                    { source: "payrollTax", target: "takeHomePay", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                ],
            },
            calculate: calculatePayrollTax,
        },
        {
            id: "selfEmploymentTax",
            label: "Self-Employment Tax",
            shortLabel: "Self-Employment Tax",
            sankeySettings: {
                node: { fill: "var(--sankey-node-6)", stroke: "var(--sankey-link-tax)" },
                link: [
                    { source: "selfEmploymentTax", target: "takeHomePay", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                ],
            },
            calculate: calculateSelfEmploymentTax,
        },
        {
            id: "takeHomePay",
            label: "Take-Home Pay",
            shortLabel: "Take-Home Pay",
            sankeySettings: {
                node: { fill: "var(--sankey-node-keep)", stroke: "var(--sankey-link-keep)" },
            },
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const seIncome = selfEmploymentIncome(inputs);
                const ordinary = ordinaryIncome(inputs);
                const stcg = shortTermCapGains(inputs);
                const ltcg = longTermCapGains(inputs);
                const totalIncome = wages + seIncome + ordinary + stcg + ltcg;
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const saltAmt = salt(inputs);
                const medical = medicalDental(inputs);
                const mortgage = mortgageInterest(inputs);
                const charity = charitable(inputs);
                const itemized = saltAmt + medical + mortgage + charity;
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const ordinaryTaxable = Math.max(0, wages + seIncome + ordinary + stcg - pretax - deduction);
                const ordinaryTax = calculateOrdinaryTaxTotal(ordinaryTaxable, brackets).tax;
                const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, 0);
                const credits = childTaxCredit(inputs) + educationCredits(inputs) + retirementSavingsContributions(inputs) + otherCredit(inputs);
                const federalTax = Math.max(0, ordinaryTax + ltcgTax - credits);
                const payrollTax = calculatePayrollTax(inputs);
                const selfEmpTax = calculateSelfEmploymentTax(inputs);
                return totalIncome - pretax - deduction - federalTax - payrollTax - selfEmpTax;
            },
        },
        {
            id: "effectiveTaxRate",
            label: "Effective Tax Rate",
            shortLabel: "Effective Rate",
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const seIncome = selfEmploymentIncome(inputs);
                const ordinary = ordinaryIncome(inputs);
                const stcg = shortTermCapGains(inputs);
                const ltcg = longTermCapGains(inputs);
                const totalIncome = wages + seIncome + ordinary + stcg + ltcg;
                if (totalIncome <= 0) return 0;
                const federalTax = calculateFederalIncomeTaxAfterCredits(inputs);
                return federalTax / totalIncome;
            },
        },
        {
            id: "marginalFederalRate",
            label: "Marginal Tax Rate",
            shortLabel: "Marginal Rate",
            calculate: (inputs) => {
                const wages = wageIncome(inputs);
                const seIncome = selfEmploymentIncome(inputs);
                const ordinary = ordinaryIncome(inputs);
                const stcg = shortTermCapGains(inputs);
                const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
                const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
                const standard = getStandardDeduction(taxData, filingStatus);
                const deduction = Math.max(itemized, standard);
                const taxableIncome = Math.max(0, wages + seIncome + ordinary + stcg - pretax - deduction);
                const brackets = getOrdinaryBrackets(taxData, filingStatus);
                const result = calculateOrdinaryTaxTotal(taxableIncome, brackets);
                return result.marginalRate;
            },
        },
    ];
}

export function getConfigItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        ...makeIncomeInputsConfig(taxData, filingStatus),
        ...makePretaxInputsConfig(taxData, filingStatus),
        ...makeDeductionInputsConfig(taxData, filingStatus),
        ...makeCreditInputsConfig(taxData, filingStatus),
        ...makeIncomeCalculationsConfig(taxData, filingStatus),
        ...getBracketItems(taxData, filingStatus),
        ...getLtcgBracketItems(taxData, filingStatus),
        ...makeFinalTaxDestination(taxData, filingStatus),
    ];
}

export function getInputItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    return [
        ...makeIncomeInputsConfig(taxData, filingStatus),
        ...makePretaxInputsConfig(taxData, filingStatus),
        ...makeDeductionInputsConfig(taxData, filingStatus),
        ...makeCreditInputsConfig(taxData, filingStatus),
    ];
}

export type IncomeKindConfig = {
    id: string;
    label: string;
    taxTreatment: TaxTreatment;
};

export function incomeKindConfigs(taxData: TaxYearConfig, filingStatus: FilingStatus): IncomeKindConfig[] {
    const items = makeIncomeInputsConfig(taxData, filingStatus);
    return items.map(item => ({
        id: item.id,
        label: item.label,
        taxTreatment: item.taxTreatment ?? "ordinary",
    }));
}

export type DeductionKindConfig = {
    id: string;
    label: string;
    aggregationField: string;
};

export const DEDUCTION_KIND_CONFIGS: DeductionKindConfig[] = [
    { id: "salt", label: "State & Local Taxes", aggregationField: "salt" },
    { id: "medicalDental", label: "Medical & Dental", aggregationField: "medicalDental" },
    { id: "mortgageInterest", label: "Mortgage Interest", aggregationField: "mortgageInterest" },
    { id: "charitable", label: "Charitable Contributions", aggregationField: "charitable" },
];

export type FederalCreditConfig = {
    id: string;
    label: string;
    aggregationField: string;
};

export const FEDERAL_CREDIT_CONFIGS: FederalCreditConfig[] = [
    { id: "childTaxCredit", label: "Child Tax Credit", aggregationField: "childTaxCredit" },
    { id: "educationCredits", label: "Education Credits", aggregationField: "educationCredits" },
    { id: "retirementSavingsContributions", label: "Retirement Savings Contributions", aggregationField: "retirementSavings" },
    { id: "otherFederalCredit", label: "Other Federal Credit", aggregationField: "other" },
];

export type PretaxBenefitConfig = {
    id: string;
    label: string;
    limitKey?: keyof TaxYearConfig["pretaxLimits"];
    limitFn?: (limits: TaxYearConfig["pretaxLimits"], joint: boolean) => number;
    isSpouseSpecific: boolean;
    aggregationField: string;
};

export const PRETAX_BENEFIT_CONFIGS: PretaxBenefitConfig[] = [
    { id: "401k", label: "401(k) Deferrals", limitKey: "electiveDeferral401k", isSpouseSpecific: true, aggregationField: "401k" },
    { id: "hsa", label: "HSA Contributions", limitFn: (limits, joint) => joint ? limits.hsaFamily : limits.hsaSelfOnly, isSpouseSpecific: true, aggregationField: "hsa" },
    { id: "traditionalIra", label: "Traditional IRA", limitKey: "traditionalIraContribution", isSpouseSpecific: true, aggregationField: "ira" },
    { id: "otherPretax", label: "Other Pre-tax", isSpouseSpecific: false, aggregationField: "other" },
];

export type SelfEmploymentConfig = {
    id: string;
    label: string;
    netEarningsRate: number;
    ssMultiplier: number;
};

export const SELF_EMPLOYMENT_CONFIGS: SelfEmploymentConfig[] = [
    { id: "selfEmployment", label: "Self-Employment Income", netEarningsRate: 0.9235, ssMultiplier: 2 },
];

export function calculateLtcgTax(
    taxableLtcg: number,
    thresholds: { zeroRateMax: number; fifteenRateMax: number },
    baseIncome: number,
): { tax: number; segments: LtcgTaxSegment[] } {
    const segments: LtcgTaxSegment[] = [];
    let totalTax = 0;
    let remaining = taxableLtcg;
    let lowerBound = baseIncome;

    for (const cfg of LTCG_BRACKET_CONFIGS) {
        if (remaining <= 0) break;

        const upperBound = cfg.thresholdKey ? thresholds[cfg.thresholdKey] : Number.POSITIVE_INFINITY;
        const amountInBracket = Math.max(0, Math.min(remaining, Math.max(0, upperBound - lowerBound)));

        if (amountInBracket > 0) {
            const taxAmount = amountInBracket * cfg.rate;
            totalTax += taxAmount;
            segments.push({
                rate: cfg.rate,
                upTo: cfg.thresholdKey ? thresholds[cfg.thresholdKey] : null,
                rangeStart: lowerBound,
                rangeEnd: cfg.thresholdKey ? thresholds[cfg.thresholdKey] : null,
                incomeAmount: amountInBracket,
                taxAmount,
            });
            remaining -= amountInBracket;
        }
        lowerBound = upperBound;
    }

    return { tax: totalTax, segments };
}

export function calculateBracketTax(
    taxableIncome: number,
    brackets: Array<{ rate: number; upTo: number | null }>,
): { tax: number; marginalRate: number; segments: LtcgTaxSegment[] } {
    let remaining = taxableIncome;
    let lowerBound = 0;
    let totalTax = 0;
    const usedSegments: LtcgTaxSegment[] = [];

    for (const bracket of brackets) {
        if (remaining <= 0) break;
        const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
        const amountInBracket = Math.min(remaining, upperBound - lowerBound);
        if (amountInBracket > 0) {
            const taxAmount = amountInBracket * bracket.rate;
            totalTax += taxAmount;
            remaining -= amountInBracket;
            usedSegments.push({
                rate: bracket.rate,
                upTo: bracket.upTo,
                rangeStart: lowerBound,
                rangeEnd: bracket.upTo,
                incomeAmount: amountInBracket,
                taxAmount,
            });
        }
        lowerBound = upperBound;
    }
    const marginalRate = usedSegments.slice(-1)[0]?.rate ?? 0;
    return { tax: totalTax, marginalRate, segments: usedSegments };
}

export const SANKEY_IDS = {
    ordinaryTaxableIncome: "ordinary-taxable-income",
    payrollOrdinaryStrip: "payroll-ordinary-strip",
    longTermTaxableIncome: "long-term-taxable-income",
    ltcgDeductionShield: "ltcg-deduction-shield",
    taxesFederal: "taxes-federal",
    taxesPayroll: "taxes-payroll",
    federalCredits: "federal-credits",
    keep: "keep",
    deductionBenefitSink: "deduction-benefit-sink",
} as const;

export type SankeyChartNode = {
    id: string;
    label: string;
    kind: string;
    amount: number;
    column?: number;
    order?: number;
    fill?: string;
    stroke?: string;
    incomeKind?: string;
};

export type SankeyChartLink = {
    sourceId: string;
    targetId: string;
    value: number;
    fill?: string;
    stroke?: string;
};

export function getActiveSankeyItems(
    items: configItem[],
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus
): configItem[] {
    return items.filter(item => {
        if (!item.calculate) return false;
        const value = item.calculate(inputs, taxData, filingStatus);
        return value > 0;
    });
}

export function computeSankeyFromConfig(
    items: configItem[],
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus
): { nodes: SankeyChartNode[]; links: SankeyChartLink[] } {
    const computedValues = new Map<string, number>();
    
    for (const item of items) {
        if (item.calculate) {
            const value = item.calculate(inputs, taxData, filingStatus);
            computedValues.set(item.id, value);
        }
    }
    
    return computeSankeyFromConfigWithValues(items, computedValues);
}

export function computeSankeyFromConfigWithValues(
    items: configItem[],
    computedValues: Map<string, number>
): { nodes: SankeyChartNode[]; links: SankeyChartLink[] } {
    const nodeMap = new Map<string, SankeyChartNode>();
    const links: SankeyChartLink[] = [];
    const targetNodeIds = new Set<string>();
    const sourceNodeIds = new Set<string>();

    // First pass: collect all target IDs that have incoming links from sources with values
    for (const item of items) {
        const value = computedValues.get(item.id) ?? 0;
        
        if ((item.sankeySettings as { link?: SankeyLink[] })?.link && value > 0) {
            for (const link of (item.sankeySettings as { link?: SankeyLink[] })?.link ?? []) {
                sourceNodeIds.add(link.source);
                targetNodeIds.add(link.target);
                links.push({
                    sourceId: link.source,
                    targetId: link.target,
                    value: value,
                    fill: link.fill,
                    stroke: link.stroke,
                });
            }
        }
    }

    // Second pass: create nodes
    for (const item of items) {
        const value = computedValues.get(item.id) ?? 0;
        const nodeId = item.id;

        // Create node if item has sankeySettings.node and has value > 0
        if ((item.sankeySettings as { node?: SankeyNode })?.node && value > 0) {
            nodeMap.set(nodeId, {
                id: nodeId,
                label: item.label,
                kind: item.id,
                amount: value,
                fill: (item.sankeySettings as { node?: SankeyNode }).node?.fill,
                stroke: (item.sankeySettings as { node?: SankeyNode }).node?.stroke,
            });
        }
        // Create node for source IDs that have value > 0 (even without node config)
        else if (sourceNodeIds.has(nodeId) && value > 0) {
            nodeMap.set(nodeId, {
                id: nodeId,
                label: item.label,
                kind: item.id,
                amount: value,
            });
        }
        // Create node for target IDs that don't have explicit node config
        else if (targetNodeIds.has(nodeId)) {
            nodeMap.set(nodeId, {
                id: nodeId,
                label: item.label,
                kind: item.id,
                amount: value,
            });
        }
    }

    return { nodes: [...nodeMap.values()], links };
}