export { calculateTaxes } from "~/lib/taxCalc.calculateTaxes";
export { calculatePayrollTax, calculateSelfEmploymentTax } from "~/lib/taxCalc.payroll";
export { sumLabeledAmountSources } from "~/lib/taxCalc.labeledAmountSource";
export { incomeSourceDisplayLabel, newIncomeSource } from "~/lib/taxCalc.incomeSource";
export { newFederalTaxCreditSource } from "~/lib/taxCalc.federalTaxCreditSource";
export { newItemizedDeductionSource } from "~/lib/taxCalc.itemizedDeductionSource";
export {
  aggregatePretaxFromSources,
  emptyAggregatedPretax,
  newPretaxBenefitSource,
  pretaxScalarsToMinimalSources,
} from "~/lib/taxCalc.pretaxBenefitSource";
export type {
  TaxInput,
  TaxResult,
  TaxSegment,
  IncomeKind,
  IncomeSource,
  PretaxBenefitKind,
  PretaxBenefitSource,
  ItemizedDeductionKind,
  ItemizedDeductionSource,
  FederalTaxCreditKind,
  FederalTaxCreditSource,
  DeductionKind,
} from "~/lib/taxCalc.types";

export { runCalculationPipeline, createInitialState, createDefaultVisualizationConfig, getTaxItemCalc, getEnabledTaxItemCalcs, buildTaxResultFromState, getResults } from "~/lib/taxCalc.pipeline";
export { generateVisualizationConfig, computeMetrics, getHighlightedMetrics, formatMetricValue } from "~/lib/config/visualization";
export type { TaxCalculationInputs, TaxCalculationState, TaxItemResult, TaxItemCategory, ValidationResult } from "~/lib/taxConfig.types";
export type { VisualizationConfig, MetricConfig, SankeyNodeConfig, FootnoteConfig } from "~/lib/config/visualization";
