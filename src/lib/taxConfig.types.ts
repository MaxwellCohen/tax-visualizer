import type {
  FederalTaxCreditSource,
  IncomeSource,
  ItemizedDeductionSource,
  PretaxBenefitSource,
} from "~/lib/taxCalc.types";
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";

export type TaxItemCategory = "income" | "pretax" | "deduction" | "credit" | "tax";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type TaxItemResult = {
  id: string;
  label: string;
  amount: number;
  category: TaxItemCategory;
  subcategory?: string;
  metadata?: Record<string, unknown>;
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
  results: Map<string, TaxItemResult>;
  warnings: string[];
  errors: string[];
  metadata: Record<string, unknown>;
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

export function createInitialState(inputs: TaxCalculationInputs): TaxCalculationState {
  return {
    inputs,
    results: new Map(),
    warnings: [],
    errors: [],
    metadata: {},
  };
}