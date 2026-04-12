export { calculateTaxes } from "~/lib/taxCalc.calculateTaxes";
export { incomeSourceDisplayLabel, newIncomeSource } from "~/lib/taxCalc.labeledAmountSource";
export { pretaxScalarsToMinimalSources, emptyAggregatedPretax, newPretaxBenefitSource } from "~/lib/taxCalc.pretaxBenefitSource";
export { newItemizedDeductionSource } from "~/lib/taxCalc.itemizedDeductionSource";
export { newFederalTaxCreditSource } from "~/lib/taxCalc.federalTaxCreditSource";
export { calculatePayrollTax, calculateSelfEmploymentTax } from "~/lib/taxCalc.payroll";
export { clampTaxFormData } from "~/lib/taxCalc.clamp";
export type {
  TaxFormData,
  TaxFormRow,
  TaxResult,
  TaxChartMetrics,
  TaxComputedRow,
  TaxResultRow,
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
export type { TaxCalculationInputs, TaxCalculationState, TaxItemResult, TaxItemCategory, ValidationResult } from "~/lib/taxConfig.types";

export { runCalculationPipeline, createInitialState, buildTaxResultFromState, getResults, getTaxItemCalc, getEnabledTaxItemCalcs } from "~/lib/taxCalc.pipeline";
export { resolveTaxChartMetrics } from "~/lib/taxResult.resolve";
export { computeMetrics } from "~/lib/config/visualization";

export { buildDisplayItems, getDisplayItemsByCategory, DISPLAY_ITEMS_CONFIG, buildDisplayItemsConfig, getPretaxBenefitConfig, getPretaxLimit, PRETAX_BENEFIT_CONFIGS, INCOME_KIND_CONFIGS, DEDUCTION_KIND_CONFIGS, FEDERAL_CREDIT_CONFIGS, SELF_EMPLOYMENT_CONFIGS, calculateBracketTax, calculateLtcgTax, buildTaxWarnings, TAX_WARNING_CONFIGS, PRETAX_BENEFIT_KIND_VALUES, ITEMIZED_DEDUCTION_KIND_VALUES, FEDERAL_TAX_CREDIT_KIND_VALUES, INCOME_KIND_VALUES } from "~/lib/config/taxItems";
export type { DisplayItem, DisplayCategory, DisplayItemFormat, DisplayItemConfig, PretaxBenefitConfig, IncomeKindConfig, DeductionKindConfig, FederalCreditConfig, TaxBracketSegment, SelfEmploymentConfig, TaxWarningConfig } from "~/lib/config/taxItems";

export { buildDefaultMetricsConfig } from "~/lib/taxVisualization.config";
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
