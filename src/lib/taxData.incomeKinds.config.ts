import type { IncomeKind } from "~/lib/taxCalc.types";
import { getTaxYearConfig, type FilingStatus } from "~/lib/taxData";
import { incomeKindConfigs, type TaxTreatment } from "~/lib/config";

export type IncomeKindConfig = {
  kind: IncomeKind;
  label: string;
  chartOrder: number;
  defaultDisplayLabel: string;
  taxTreatment: TaxTreatment;
};

function getIncomeKindConfigs(taxData: ReturnType<typeof getTaxYearConfig>, filingStatus: FilingStatus): IncomeKindConfig[] {
  if (!taxData) return [];
  const configs = incomeKindConfigs(taxData, filingStatus);
  return configs.map((item, idx) => ({
    kind: item.id.replace("input-", "") as IncomeKind,
    label: item.label,
    chartOrder: idx,
    defaultDisplayLabel: item.label,
    taxTreatment: item.taxTreatment,
  }));
}

export const INCOME_KINDS_CONFIG: IncomeKindConfig[] = (() => {
  const taxData = getTaxYearConfig(2024);
  return getIncomeKindConfigs(taxData, "single");
})();

const INCOME_KINDS_MAP: Record<IncomeKind, IncomeKindConfig> = Object.fromEntries(
  INCOME_KINDS_CONFIG.map((c) => [c.kind, c])
) as Record<IncomeKind, IncomeKindConfig>;



/**
 * Sankey income-column vertical order (lower = higher on chart).
 * Differs from form order: long-term gains stack above wage ordinary flow.
 */
export const SANKEY_INCOME_KIND_ORDER_BY_KIND: Record<string, number> = {
  longTermCapGains: 0,
  shortTermCapGains: 1,
  wages: 2,
  selfEmployment: 3,
  ordinary: 4,
};


export function incomeKindLabel(kind: IncomeKind): string {
  return INCOME_KINDS_MAP[kind]?.label ?? kind;
}

