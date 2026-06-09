import type { TaxFormData } from "~/lib/tax/form/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/tax/data/types";
import { getConfigItems } from "~/lib/config/taxPage/taxPage.config";
import type { ConfigItem } from "~/lib/config/taxPage/types";
import { buildScenarioMetrics } from "~/lib/tax/calc/scenarioMetrics";
import { evaluateTaxScenario } from "~/lib/tax/calc/taxEvaluation";

export type CalculatedConfigItem = ConfigItem & { computedValue: number };
export type CalculatedConfigValueMap = Map<string, number>;

export function calculateAllConfigValues(
  formData: TaxFormData,
  taxData: TaxYearConfig,
  filingStatus: FilingStatus
): CalculatedConfigItem[] {
  const items = getConfigItems(taxData, filingStatus);
  const metrics = buildScenarioMetrics(formData.rows);
  const context = evaluateTaxScenario(formData.rows, taxData, filingStatus, metrics);
  return items.map(item => ({
    ...item,
    computedValue: item.calculate?.(formData.rows, taxData, filingStatus, context) ?? 0,
  }));
}

export function calculatedConfigValuesById(items: CalculatedConfigItem[]): CalculatedConfigValueMap {
  return new Map(items.map((item) => [item.id, item.computedValue]));
}
