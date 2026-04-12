import type { TaxCalculationInputs, TaxCalculationState, TaxItemResult } from "~/lib/taxConfig.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { createInitialState } from "~/lib/taxConfig.types";
import { getEnabledTaxItemCalcs, getTaxItemCalc, type TaxItemCalc } from "~/lib/config/taxItems";
import { generateVisualizationConfig, type VisualizationConfig } from "~/lib/config/visualization";

export { createInitialState } from "~/lib/taxConfig.types";
export type { TaxCalculationInputs, TaxCalculationState, TaxItemResult } from "~/lib/taxConfig.types";
export type { TaxYearConfig } from "~/lib/taxData.types";
export { getTaxItemCalc, getEnabledTaxItemCalcs } from "~/lib/config/taxItems";
export { generateVisualizationConfig } from "~/lib/config/visualization";
export type { VisualizationConfig } from "~/lib/config/visualization";

export function createDefaultVisualizationConfig(): VisualizationConfig {
  return generateVisualizationConfig();
}

function sortByDependencies(items: TaxItemCalc[]): TaxItemCalc[] {
  const result: TaxItemCalc[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(item: TaxItemCalc): void {
    if (visited.has(item.id)) return;
    if (visiting.has(item.id)) {
      console.warn(`Circular dependency detected for ${item.id}`);
      return;
    }

    visiting.add(item.id);

    for (const depId of item.dependencies) {
      const depItem = items.find(i => i.id === depId);
      if (depItem && !visited.has(depId)) {
        visit(depItem);
      }
    }

    visiting.delete(item.id);
    visited.add(item.id);
    result.push(item);
  }

  for (const item of items) {
    if (!visited.has(item.id)) {
      visit(item);
    }
  }

  return result;
}

export function runCalculationPipeline(
  inputs: TaxCalculationInputs,
  config: TaxYearConfig,
): TaxCalculationState {
  const state = createInitialState(inputs);
  const enabledItems = getEnabledTaxItemCalcs();
  const sortedItems = sortByDependencies(enabledItems);

  for (const item of sortedItems) {
    if (!item.enabled) {
      continue;
    }

    const missingDeps = item.dependencies.filter((depId) => !state.results.has(depId));
    if (missingDeps.length > 0) {
      state.errors.push(`Tax item "${item.id}" missing dependencies: ${missingDeps.join(", ")}`);
      continue;
    }

    try {
      const result = item.calcFn(inputs, state, config);
      state.results.set(item.id, result);
    } catch (error) {
      state.errors.push(`Error calculating "${item.id}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (state.errors.length > 0) {
    console.error("Tax calculation errors:", state.errors);
  }

  return state;
}

export function buildTaxResultFromState(state: TaxCalculationState): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const results = state.results;

  extractIncomeData(results, result);
  extractPretaxData(results, result);
  extractDeductionData(results, result);
  extractFederalTaxData(results, result);
  extractPayrollData(results, result);
  extractTakeHomeData(results, result);
  extractCombinedFederalTax(results, result);

  result.warnings = state.warnings;
  result.errors = state.errors;
  result.metadata = state.metadata;

  return result;
}

function extractIncomeData(results: Map<string, TaxItemResult>, result: Record<string, unknown>): void {
  const incomeAgg = results.get("income-aggregation");
  if (!incomeAgg) return;

  result.totalIncome = incomeAgg.amount;
  result.wageIncome = (incomeAgg.metadata?.wageIncome as number) ?? 0;
  result.ordinaryGrossIncome = ((incomeAgg.metadata?.ordinaryIncome as number) ?? 0) + ((incomeAgg.metadata?.shortTermCapGains as number) ?? 0);
  result.shortTermCapGainsGrossIncome = (incomeAgg.metadata?.shortTermCapGains as number) ?? 0;
  result.longTermCapitalGainsGrossIncome = (incomeAgg.metadata?.longTermCapGains as number) ?? 0;
  result.incomeSources = (incomeAgg.metadata?.sources as unknown[]) ?? [];
}

function extractPretaxData(results: Map<string, TaxItemResult>, result: Record<string, unknown>): void {
  const pretax = results.get("pretax-benefits");
  if (!pretax) return;

  result.preTaxTotal = pretax.amount;
  result.preTax401k = pretax.metadata?.effective401 ?? 0;
  result.preTaxHsa = pretax.metadata?.effectiveHsa ?? 0;
  result.preTaxOther = pretax.metadata?.effectiveOther ?? 0;
}

function extractDeductionData(results: Map<string, TaxItemResult>, result: Record<string, unknown>): void {
  const deduction = results.get("deduction-calculation");
  if (!deduction) return;

  result.deductionAmount = deduction.amount;
  result.deductionKind = deduction.metadata?.kind ?? "standard";
  result.standardDeduction = deduction.metadata?.standardDeduction ?? 0;
}

function extractFederalTaxData(results: Map<string, TaxItemResult>, result: Record<string, unknown>): void {
  const ordinaryTax = results.get("federal-ordinary-tax");
  if (ordinaryTax) {
    result.federalOrdinaryIncomeTax = ordinaryTax.amount;
    result.ordinaryTaxableIncome = ordinaryTax.metadata?.ordinaryTaxableIncome ?? 0;
    result.ordinaryFederalSegments = ordinaryTax.metadata?.segments ?? [];
  }

  const ltcgTax = results.get("federal-ltcg-tax");
  if (ltcgTax) {
    result.federalLongTermCapGainsTax = ltcgTax.amount;
    result.longTermTaxableIncome = ltcgTax.metadata?.longTermTaxableIncome ?? 0;
  }

  const niit = results.get("federal-niit");
  if (niit) {
    result.federalNetInvestmentIncomeTax = niit.amount;
    result.netInvestmentIncome = niit.metadata?.netInvestmentIncome ?? 0;
  }

  const credits = results.get("tax-credits");
  if (credits) {
    result.federalTaxCreditsEntered = credits.metadata?.creditsEntered ?? 0;
    result.federalTaxCreditsApplied = credits.metadata?.creditsApplied ?? 0;
  }
}

function extractPayrollData(results: Map<string, TaxItemResult>, result: Record<string, unknown>): void {
  const payroll = results.get("payroll-tax");
  if (!payroll) return;

  result.payrollTax = payroll.amount;
  result.socialSecurityTax = (payroll.metadata?.socialSecurityTax as number) ?? 0;
  result.medicareTax = ((payroll.metadata?.medicareTax as number) ?? 0) + ((payroll.metadata?.additionalMedicare as number) ?? 0);
}

function extractTakeHomeData(results: Map<string, TaxItemResult>, result: Record<string, unknown>): void {
  const takeHome = results.get("take-home-calculation");
  if (!takeHome) return;

  result.takeHomePay = takeHome.amount;
  result.effectiveTaxRate = (takeHome.metadata?.effectiveRate as number) ?? 0;
  result.traditionalIra = (takeHome.metadata?.pretaxIra as number) ?? 0;
}

function extractCombinedFederalTax(results: Map<string, TaxItemResult>, result: Record<string, unknown>): void {
  const ordinaryTax = results.get("federal-ordinary-tax");
  const ltcgTax = results.get("federal-ltcg-tax");
  const niit = results.get("federal-niit");
  const credits = results.get("tax-credits");

  if (!ordinaryTax || !ltcgTax || !niit || !credits) return;

  const totalTaxBeforeCredits = ((ordinaryTax.amount as number) ?? 0) + ((ltcgTax.amount as number) ?? 0) + ((niit.amount as number) ?? 0);
  const creditsApplied = (credits.metadata?.creditsApplied as number) ?? 0;
  result.federalIncomeTaxBeforeCredits = totalTaxBeforeCredits;
  result.federalIncomeTax = Math.max(0, totalTaxBeforeCredits - creditsApplied);
  result.taxableIncome = ((ordinaryTax.metadata?.ordinaryTaxableIncome as number) ?? 0) + ((ltcgTax.metadata?.longTermTaxableIncome as number) ?? 0);
}

export function getResults(state: TaxCalculationState): Map<string, TaxItemResult> {
  return state.results;
}