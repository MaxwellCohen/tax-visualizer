import type { IncomeKind } from "~/lib/taxCalc.types";
import { INCOME_KIND_SANKEY_ORDER } from "~/lib/config/sankeyOrder.config";

export type IncomeKindConfig = {
  kind: IncomeKind;
  label: string;
  chartOrder: number;
  defaultDisplayLabel: string;
  taxTreatment: "ordinary" | "selfEmployment" | "shortTermCapGains" | "longTermCapGains";
};

export const INCOME_KINDS_CONFIG: IncomeKindConfig[] = INCOME_KIND_SANKEY_ORDER.map((k) => {
  const configs: Record<IncomeKind, Omit<IncomeKindConfig, "kind" | "chartOrder">> = {
    longTermCapGains: {
      label: "Long-term capital gains",
      defaultDisplayLabel: "Long-term capital gains",
      taxTreatment: "longTermCapGains",
    },
    shortTermCapGains: {
      label: "Short-term capital gains",
      defaultDisplayLabel: "Short-term capital gains",
      taxTreatment: "shortTermCapGains",
    },
    wages: {
      label: "W-2 wages",
      defaultDisplayLabel: "W-2 wages",
      taxTreatment: "ordinary",
    },
    ordinary: {
      label: "Other ordinary income",
      defaultDisplayLabel: "Other income",
      taxTreatment: "ordinary",
    },
    selfEmployment: {
      label: "1099 self-employment",
      defaultDisplayLabel: "1099 self-employment income",
      taxTreatment: "selfEmployment",
    },
  };
  return {
    kind: k.kind as IncomeKind,
    chartOrder: k.order,
    ...configs[k.kind as IncomeKind],
  };
});

export const INCOME_KINDS_MAP: Record<IncomeKind, IncomeKindConfig> = Object.fromEntries(
  INCOME_KINDS_CONFIG.map((c) => [c.kind, c])
) as Record<IncomeKind, IncomeKindConfig>;

export const INCOME_KIND_CHART_ORDER: IncomeKind[] = INCOME_KINDS_CONFIG.map(c => c.kind);

export function incomeKindChartOrder(kind: IncomeKind): number {
  const idx = INCOME_KIND_CHART_ORDER.indexOf(kind);
  return idx >= 0 ? idx : 99;
}

export function incomeKindLabel(kind: IncomeKind): string {
  return INCOME_KINDS_MAP[kind]?.label ?? kind;
}

export function incomeKindDefaultLabel(kind: IncomeKind): string {
  return INCOME_KINDS_MAP[kind]?.defaultDisplayLabel ?? kind;
}