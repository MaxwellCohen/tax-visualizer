import type {
  FederalTaxCreditSource,
  IncomeSource,
  ItemizedDeductionSource,
  PretaxBenefitSource,
} from "~/lib/taxCalc.types";
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type {
  DeductionCalculationResult,
  FederalLtcgTaxResult,
  FederalNiitResult,
  FederalOrdinaryTaxResult,
  IncomeAggregationResult,
  PayrollTaxResult,
  PretaxBenefitsResult,
  SelfEmploymentTaxResult,
  TakeHomeResult,
  TaxCreditsResult,
  TaxItemResult,
} from "~/lib/taxItemResult.types";

export type { TaxItemResult } from "~/lib/taxItemResult.types";

/** All pipeline intermediates from inputs + year config (replaces `TaxItemResult[]` on state). */
export type TaxPipelineSnapshot = {
  income: IncomeAggregationResult;
  pretax: PretaxBenefitsResult;
  deduction: DeductionCalculationResult;
  federalOrdinary: FederalOrdinaryTaxResult;
  federalLtcg: FederalLtcgTaxResult;
  niit: FederalNiitResult;
  taxCredits: TaxCreditsResult;
  payroll: PayrollTaxResult;
  selfEmployment: SelfEmploymentTaxResult;
  takeHome: TakeHomeResult;
};

export type TaxItemCategory = "income" | "pretax" | "deduction" | "credit" | "tax";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type TaxCalculationInputs = {
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  pretaxBenefitSources: PretaxBenefitSource[];
  useItemizedDeductions: boolean;
  itemizedDeductions: ItemizedDeductionSource[];
  federalTaxCredits: FederalTaxCreditSource[];
};

export type TaxItemDefinition = {
  id: string;
  category: TaxItemCategory;
  label: string;
  description?: string;
  calculate: (
    inputs: TaxCalculationInputs,
    state: TaxCalculationState,
    config: TaxYearConfig,
  ) => TaxItemResult;
  dependencies: string[];
  displayOrder: number;
  enabled: boolean;
  validation?: (inputs: TaxCalculationInputs, config: TaxYearConfig) => ValidationResult;
};

export type TaxCalculationState = {
  inputs: TaxCalculationInputs;
  errors: string[];
};

export type CalculationStep = {
  id: string;
  taxItemId: string;
  enabled: boolean;
  dependencies: string[];
};

export type CalculationPipeline = {
  steps: CalculationStep[];
};

export type VisualizationMetric = {
  id: string;
  sourceField: string;
  label: string;
  showWhen?: (result: TaxCalculationState) => boolean;
  displayOrder: number;
  highlight?: boolean;
  format?: "currency" | "percent" | "number";
};

export type VisualizationFootnote = {
  id: string;
  template: (state: TaxCalculationState) => string;
  displayOrder: number;
};

export type VisualizationConfig = {
  metrics: VisualizationMetric[];
  footnotes: VisualizationFootnote[];
  narrativeSections: Array<{
    id: string;
    enabled: boolean;
    template: (state: TaxCalculationState) => string;
    displayOrder: number;
  }>;
};

export type TaxConfig = {
  pipeline: CalculationPipeline;
  visualization: VisualizationConfig;
};

function taxItemResultById<const T extends TaxItemResult["id"]>(
  results: TaxItemResult[],
  id: T,
): Extract<TaxItemResult, { id: T }> | undefined {
  return results.find((r) => r.id === id) as Extract<TaxItemResult, { id: T }> | undefined;
}

export function createInitialState(inputs: TaxCalculationInputs): TaxCalculationState {
  return {
    inputs,
    errors: [],
  };
}