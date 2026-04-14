export { calculateTaxes, calculateAllConfigValues } from "~/lib/taxCalc.calculateTaxes";
export type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
export { incomeSourceDisplayLabel, newIncomeSource } from "~/lib/taxCalc.labeledAmountSource";
export { pretaxScalarsToMinimalSources, emptyAggregatedPretax, newPretaxBenefitSource } from "~/lib/taxCalc.pretaxBenefitSource";
export { newItemizedDeductionSource } from "~/lib/taxCalc.itemizedDeductionSource";
export { newFederalTaxCreditSource } from "~/lib/taxCalc.federalTaxCreditSource";
export { clampTaxFormData } from "~/lib/taxCalc.clamp";
export type {
  TaxFormData,
  TaxFormRow,
  TaxResult,
  TaxResultDisplay,
  TaxResultMekkoDisplay,
  TaxComputedRow,
  TaxComputedSegmentRow,
  TaxResultRow,
  TaxMetricLine,
  TaxMetricValueKind,
  TaxMetricComputedValue,
} from "~/lib/taxForm.types";
export type {
  IncomeKind,
  TaxSegment,
  IncomeSource,
  PretaxBenefitSource,
  ItemizedDeductionSource,
  FederalTaxCreditSource,
  DeductionKind,
  FederalTaxCreditKind,
  ItemizedDeductionKind,
  PretaxBenefitKind,
} from "~/lib/taxCalc.types";
export type {
  TaxCalculationInputs,
  TaxCalculationState,
  TaxItemResult,
  TaxItemCategory,
  TaxPipelineSnapshot,
  ValidationResult,
} from "~/lib/taxConfig.types";

export {
  chartMetricNumeric,
  chartMetricSegments,
  deductionKindFromTaxResult,
  getLongTermCapitalGainsSegments,
  getOrdinaryFederalSegments,
} from "~/lib/taxChartMetricRead";
export {
  computeTaxMetricLines,
  DISPLAY_ITEMS_CONFIG,
  taxMetricsRecordFromLines,
} from "~/lib/config/chartMetricsRegistry";
export { buildDisplayItems } from "~/lib/taxDisplayItems";
export type { ChartMetricSummaryHint, ChartMetricSummaryCategory } from "~/lib/config/chartMetricsRegistry";

export { PRETAX_BENEFIT_CONFIGS,  DEDUCTION_KIND_CONFIGS, FEDERAL_CREDIT_CONFIGS, SELF_EMPLOYMENT_CONFIGS, calculateBracketTax, calculateLtcgTax } from "~/lib/config";
export type { PretaxBenefitConfig, IncomeKindConfig, DeductionKindConfig, FederalCreditConfig, SelfEmploymentConfig } from "~/lib/config";

export { PRETAX_BENEFIT_KIND_VALUES } from "~/lib/taxCalc.pretaxBenefitSource";
export { ITEMIZED_DEDUCTION_KIND_VALUES } from "~/lib/taxCalc.itemizedDeductionSource";
export { FEDERAL_TAX_CREDIT_KIND_VALUES } from "~/lib/taxCalc.federalTaxCreditSource";

export type { MetricDisplay } from "~/lib/taxVisualization.config";

export {
  getTaxYearFromRows,
  getFilingStatusFromRows,
  getUseItemizedFromRows,
  rowsToTaxCalculationInputs,
} from "~/lib/taxCalc.inputs";

export {
  newIncomeRow,
  newPretaxRow,
  newDeductionRow,
  newCreditRow,
  pretaxSourcesToRows,
  incomeSourcesToRows,
  itemizedSourcesToRows,
  federalCreditsToRows,
  taxFormDataFromParts,
} from "~/lib/taxForm.factories";
