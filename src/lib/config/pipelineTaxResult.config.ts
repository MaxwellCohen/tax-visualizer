import type { DeductionKind } from "~/lib/taxCalc.types";
import type { TaxChartMetrics } from "~/lib/taxForm.types";
import { incomeKindIdToDisplayType } from "~/lib/config/taxItems";

/** Display types from `buildDisplayItemsConfig` / `DISPLAY_ITEMS_CONFIG` (stable string ids). */
export const DISPLAY = {
  totalIncome: "total-income",
  preTaxTotal: "total-pretax",
  wagesAfterPretax: "wages-after-pretax",
  standardDeduction: "standard-deduction",
  deductionUsed: "deduction-used",
  ordinaryTaxableIncome: "ordinary-taxable-income",
  ltcgTaxableIncome: "ltcg-taxable-income",
  federalOrdinaryTax: "federal-ordinary-tax",
  federalLtcgTax: "federal-ltcg-tax",
  federalNiit: "federal-niit",
  payrollTax: "payroll-tax",
  socialSecurityTax: "social-security-tax",
  medicareTax: "medicare-tax",
  takeHomePay: "take-home-pay",
  effectiveTaxRate: "effective-tax-rate",
  preTax401k: "401k",
  preTaxHsa: "hsa",
  preTaxOther: "other",
  traditionalIra: "traditional-ira",
} as const;

const W = incomeKindIdToDisplayType("wages");
const SE = incomeKindIdToDisplayType("selfEmployment");
const ORD = incomeKindIdToDisplayType("ordinary");
const ST = incomeKindIdToDisplayType("shortTermCapGains");
const LT = incomeKindIdToDisplayType("longTermCapGains");

/**
 * Declarative rules for building the flat pipeline metrics record (see `evaluatePipelineFlatSpec` in taxCalc.pipeline).
 */
export type PipelineFlatValueSpec =
  | { kind: "display"; displayType: string }
  | { kind: "literalNumber"; value: number }
  | { kind: "sumDisplay"; displayTypes: readonly string[] }
  | { kind: "deductionKindFromInputs" }
  | { kind: "stateMetadataNumber"; resultId: string; field: string }
  | { kind: "segmentsFromState"; resultId: string }
  | { kind: "sumFlatNumeric"; keys: readonly (keyof TaxChartMetrics)[] }
  | { kind: "maxMinusFlat"; minuend: keyof TaxChartMetrics; subtrahend: keyof TaxChartMetrics };

export type PipelineFlatSpecEntry = {
  key: keyof TaxChartMetrics;
  spec: PipelineFlatValueSpec;
};

export const PIPELINE_FLAT_SPECS: readonly PipelineFlatSpecEntry[] = [
  { key: "totalIncome", spec: { kind: "display", displayType: DISPLAY.totalIncome } },
  { key: "wageIncome", spec: { kind: "display", displayType: W } },
  { key: "selfEmploymentIncome", spec: { kind: "display", displayType: SE } },
  { key: "ordinaryGrossIncome", spec: { kind: "sumDisplay", displayTypes: [ORD, ST] } },
  { key: "shortTermCapGainsGrossIncome", spec: { kind: "display", displayType: ST } },
  { key: "longTermCapitalGainsGrossIncome", spec: { kind: "display", displayType: LT } },
  { key: "preTaxTotal", spec: { kind: "display", displayType: DISPLAY.preTaxTotal } },
  { key: "preTax401k", spec: { kind: "display", displayType: DISPLAY.preTax401k } },
  { key: "preTaxHsa", spec: { kind: "display", displayType: DISPLAY.preTaxHsa } },
  { key: "preTaxOther", spec: { kind: "display", displayType: DISPLAY.preTaxOther } },
  { key: "traditionalIra", spec: { kind: "stateMetadataNumber", resultId: "pretax-benefits", field: "traditionalIra" } },
  { key: "wagesAfterPretax", spec: { kind: "display", displayType: DISPLAY.wagesAfterPretax } },
  { key: "deductionKind", spec: { kind: "deductionKindFromInputs" } },
  { key: "standardDeduction", spec: { kind: "display", displayType: DISPLAY.standardDeduction } },
  { key: "deductionAmount", spec: { kind: "display", displayType: DISPLAY.deductionUsed } },
  { key: "deductionAllocatedToOrdinary", spec: { kind: "literalNumber", value: 0 } },
  { key: "deductionAllocatedToLongTermGross", spec: { kind: "literalNumber", value: 0 } },
  { key: "ordinaryTaxableIncome", spec: { kind: "display", displayType: DISPLAY.ordinaryTaxableIncome } },
  { key: "longTermTaxableIncome", spec: { kind: "display", displayType: DISPLAY.ltcgTaxableIncome } },
  { key: "taxableIncome", spec: { kind: "sumFlatNumeric", keys: ["ordinaryTaxableIncome", "longTermTaxableIncome"] } },
  { key: "ordinaryFederalSegments", spec: { kind: "segmentsFromState", resultId: "federal-ordinary-tax" } },
  { key: "longTermCapitalGainsSegments", spec: { kind: "segmentsFromState", resultId: "federal-ltcg-tax" } },
  { key: "federalOrdinaryIncomeTax", spec: { kind: "display", displayType: DISPLAY.federalOrdinaryTax } },
  { key: "federalLongTermCapGainsTax", spec: { kind: "display", displayType: DISPLAY.federalLtcgTax } },
  { key: "federalNetInvestmentIncomeTax", spec: { kind: "display", displayType: DISPLAY.federalNiit } },
  { key: "netInvestmentIncome", spec: { kind: "sumDisplay", displayTypes: [ST, LT] } },
  {
    key: "federalIncomeTaxBeforeCredits",
    spec: { kind: "sumDisplay", displayTypes: [DISPLAY.federalOrdinaryTax, DISPLAY.federalLtcgTax, DISPLAY.federalNiit] },
  },
  { key: "federalTaxCredits", spec: { kind: "stateMetadataNumber", resultId: "tax-credits", field: "creditsEntered" } },
  { key: "federalTaxCreditsApplied", spec: { kind: "stateMetadataNumber", resultId: "tax-credits", field: "creditsApplied" } },
  {
    key: "federalIncomeTax",
    spec: { kind: "maxMinusFlat", minuend: "federalIncomeTaxBeforeCredits", subtrahend: "federalTaxCreditsApplied" },
  },
  { key: "payrollTax", spec: { kind: "display", displayType: DISPLAY.payrollTax } },
  { key: "selfEmploymentTax", spec: { kind: "literalNumber", value: 0 } },
  { key: "socialSecurityTax", spec: { kind: "display", displayType: DISPLAY.socialSecurityTax } },
  { key: "medicareTax", spec: { kind: "display", displayType: DISPLAY.medicareTax } },
  { key: "takeHomePay", spec: { kind: "display", displayType: DISPLAY.takeHomePay } },
  { key: "effectiveTaxRate", spec: { kind: "display", displayType: DISPLAY.effectiveTaxRate } },
];

/** Row ids whose `value` is often 0 but metadata must still be indexed (Sankey / resolve). */
export const TAX_RESULT_ROW_IDS_KEEP_WHEN_VALUE_ZERO = [
  "ordinaryFederalSegments",
  "longTermCapitalGainsSegments",
  "deductionKind",
] as const;

export const SEGMENT_METADATA_ROW_IDS = new Set<string>(["ordinaryFederalSegments", "longTermCapitalGainsSegments"]);

/** Canonical order for appending computed rows (matches prior pipeline ordering + `deductionKind`). */
export const PIPELINE_COMPUTED_ROW_ORDER = [
  "totalIncome",
  "wageIncome",
  "selfEmploymentIncome",
  "ordinaryGrossIncome",
  "shortTermCapGainsGrossIncome",
  "longTermCapitalGainsGrossIncome",
  "preTaxTotal",
  "preTax401k",
  "preTaxHsa",
  "preTaxOther",
  "traditionalIra",
  "wagesAfterPretax",
  "standardDeduction",
  "deductionAmount",
  "deductionKind",
  "deductionAllocatedToOrdinary",
  "deductionAllocatedToLongTermGross",
  "ordinaryTaxableIncome",
  "longTermTaxableIncome",
  "taxableIncome",
  "ordinaryFederalSegments",
  "longTermCapitalGainsSegments",
  "federalOrdinaryIncomeTax",
  "federalLongTermCapGainsTax",
  "federalNetInvestmentIncomeTax",
  "netInvestmentIncome",
  "federalIncomeTaxBeforeCredits",
  "federalTaxCredits",
  "federalTaxCreditsApplied",
  "federalIncomeTax",
  "payrollTax",
  "socialSecurityTax",
  "medicareTax",
  "selfEmploymentTax",
  "takeHomePay",
  "effectiveTaxRate",
] as const satisfies readonly (keyof TaxChartMetrics)[];

/** All {@link TaxChartMetrics} keys for resolve / exhaustiveness checks. */
export const TAX_CHART_METRICS_KEYS = [
  "totalIncome",
  "wageIncome",
  "selfEmploymentIncome",
  "ordinaryGrossIncome",
  "shortTermCapGainsGrossIncome",
  "longTermCapitalGainsGrossIncome",
  "preTax401k",
  "preTaxHsa",
  "preTaxOther",
  "preTaxTotal",
  "traditionalIra",
  "wagesAfterPretax",
  "deductionKind",
  "standardDeduction",
  "deductionAmount",
  "deductionAllocatedToOrdinary",
  "deductionAllocatedToLongTermGross",
  "ordinaryTaxableIncome",
  "longTermTaxableIncome",
  "taxableIncome",
  "ordinaryFederalSegments",
  "longTermCapitalGainsSegments",
  "federalOrdinaryIncomeTax",
  "federalLongTermCapGainsTax",
  "federalNetInvestmentIncomeTax",
  "netInvestmentIncome",
  "federalIncomeTaxBeforeCredits",
  "federalTaxCredits",
  "federalTaxCreditsApplied",
  "federalIncomeTax",
  "payrollTax",
  "selfEmploymentTax",
  "socialSecurityTax",
  "medicareTax",
  "takeHomePay",
  "effectiveTaxRate",
] as const satisfies readonly (keyof TaxChartMetrics)[];

/** `INCOME_KIND_CONFIGS[].aggregationField` → chart metric (for visualization row getters). */
export const INCOME_AGGREGATION_FIELD_TO_CHART_METRIC_KEY = {
  wageIncome: "wageIncome",
  selfEmploymentIncome: "selfEmploymentIncome",
  ordinaryIncome: "ordinaryGrossIncome",
  shortTermCapGains: "shortTermCapGainsGrossIncome",
  longTermCapGains: "longTermCapitalGainsGrossIncome",
} as const satisfies Record<string, keyof TaxChartMetrics>;

/** Visualization metric id → {@link TaxChartMetrics} key (omit when id equals chart key). */
export const VISUALIZATION_METRIC_ID_TO_CHART_KEY: Partial<Record<string, keyof TaxChartMetrics>> = {
  "total-income": "totalIncome",
  "wages-after-pretax": "wagesAfterPretax",
  "standard-deduction": "standardDeduction",
  "deduction-amount": "deductionAmount",
  "ordinary-taxable-income": "ordinaryTaxableIncome",
  "long-term-taxable-income": "longTermTaxableIncome",
  "federal-ordinary-tax": "federalOrdinaryIncomeTax",
  "federal-ltcg-tax": "federalLongTermCapGainsTax",
  "federal-niit": "federalNetInvestmentIncomeTax",
  "federal-income-tax": "federalIncomeTax",
  "federal-income-tax-before-credits": "federalIncomeTaxBeforeCredits",
  "social-security-tax": "socialSecurityTax",
  "medicare-tax": "medicareTax",
  "payroll-tax": "payrollTax",
  "take-home-pay": "takeHomePay",
  "effective-rate": "effectiveTaxRate",
  ordinaryIncome: "ordinaryGrossIncome",
  shortTermCapGains: "shortTermCapGainsGrossIncome",
  longTermCapGains: "longTermCapitalGainsGrossIncome",
  preTaxTotal: "preTaxTotal",
};

export function chartMetricNumeric(m: TaxChartMetrics, key: keyof TaxChartMetrics): number {
  const v = m[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Pretax benefit config `id` → chart metric key (matches `buildDefaultMetricsConfig` ids). */
export function pretaxKindIdToChartMetricKey(cfgId: string): keyof TaxChartMetrics {
  if (cfgId === "401k") return "preTax401k";
  if (cfgId === "hsa") return "preTaxHsa";
  if (cfgId === "other") return "preTaxOther";
  return "traditionalIra";
}

export function deductionKindFromInputs(useItemized: boolean): DeductionKind {
  return useItemized ? "itemized" : "standard";
}
