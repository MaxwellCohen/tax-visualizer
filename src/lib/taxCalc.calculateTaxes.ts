import type { TaxFormData } from "~/lib/taxForm.types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import { getConfigItems, type ConfigItem } from "~/lib/config/page/Page.config";

export type CalculatedConfigItem = ConfigItem & { computedValue: number };
export type CalculatedConfigValueMap = Map<string, number>;

export function calculateAllConfigValues(
  formData: TaxFormData,
  taxData: TaxYearConfig,
  filingStatus: FilingStatus
): CalculatedConfigItem[] {
  const items = getConfigItems(taxData, filingStatus);
  return items.map(item => ({
    ...item,
    computedValue: item.calculate?.(formData.rows, taxData, filingStatus) ?? 0,
  }));
}

export function calculatedConfigValuesById(items: CalculatedConfigItem[]): CalculatedConfigValueMap {
  return new Map(items.map((item) => [item.id, item.computedValue]));
}
