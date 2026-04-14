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

export function getIncomeKindConfigs(taxData: ReturnType<typeof getTaxYearConfig>, filingStatus: FilingStatus): IncomeKindConfig[] {
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

const INCOME_KIND_CHART_ORDER: IncomeKind[] = INCOME_KINDS_CONFIG.map(c => c.kind);

function incomeKindChartOrder(kind: IncomeKind): number {
  const idx = INCOME_KIND_CHART_ORDER.indexOf(kind);
  return idx >= 0 ? idx : 99;
}

export function incomeKindLabel(kind: IncomeKind): string {
  return INCOME_KINDS_MAP[kind]?.label ?? kind;
}

function incomeKindDefaultLabel(kind: IncomeKind): string {
  return INCOME_KINDS_MAP[kind]?.defaultDisplayLabel ?? kind;
}