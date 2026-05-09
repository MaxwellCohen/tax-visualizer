import {
  calculatedConfigValuesById,
  type CalculatedConfigItem,
  type CalculatedConfigValueMap,
} from "~/lib/taxCalc.calculateTaxes";
import { getChartRoleColorVar } from "~/lib/config/page/chartRole";
import type { ChartRole } from "~/lib/config/page/pageConfig.types";

export type MekkoRow = {
  id: string;
  label: string;
  total: number;
  keep: number;
  tax: number;
  chartRole: ChartRole;
  order: number;
  fill: string;
  stroke: string;
  taxFill: string;
  taxStroke: string;
};

const configValue = (values: CalculatedConfigValueMap, id: string): number => values.get(id) ?? 0;

/** Keep from sibling nodes; tax fills remainder so keep + tax === total. */
function keepTaxFromSlice(values: CalculatedConfigValueMap, total: number, keepId: string): { keep: number; tax: number } {
  if (total <= 0) return { keep: 0, tax: 0 };
  const keep = Math.max(0, Math.min(configValue(values, keepId), total));
  const tax = total - keep;
  return { keep, tax };
}

function rowFromCalculatedItem(item: CalculatedConfigItem, values: CalculatedConfigValueMap): MekkoRow {
  const row = item.mekko!;
  const total = item.computedValue;
  const chartRole = item.chartRole ?? "default";

  const { keep, tax } = row.split
    ? keepTaxFromSlice(values, total, row.split.keepId)
    : { keep: total, tax: 0 };

  return {
    id: item.id,
    label: item.labels.compact ?? item.labels.default,
    total,
    keep,
    tax,
    chartRole,
    order: row.row,
    fill: row.fill ?? getChartRoleColorVar(chartRole),
    stroke: row.stroke ?? getChartRoleColorVar(chartRole),
    taxFill: row.split?.taxFill ?? "var(--chart-tax)",
    taxStroke: row.split?.taxStroke ?? "var(--chart-tax)",
  };
}

function compareMekkoRows(a: CalculatedConfigItem, b: CalculatedConfigItem): number {
  const aRow = a.mekko!;
  const bRow = b.mekko!;
  return aRow.col - bRow.col || aRow.row - bRow.row || a.id.localeCompare(b.id);
}

export type MekkoChartData = {
  rows: MekkoRow[];
  totalIncome: number;
  takeHomePay: number;
  preTaxTotal: number;
  traditionalIra: number;
  federalIncomeTax: number;
  payrollTax: number;
  federalTaxCreditsApplied: number;
};

export function buildMekkoFromConfig(cc: CalculatedConfigItem[]): MekkoChartData | undefined {
  const values = calculatedConfigValuesById(cc);
  const rows = cc
    .filter(i => i.computedValue > 0 && i.mekko?.row)
    .sort(compareMekkoRows)
    .map(item => rowFromCalculatedItem(item, values));

  const stackedTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const totalIncome = configValue(values, "totalIncome");
  if (!rows.length || Math.max(totalIncome, stackedTotal) <= 0) return undefined;

  return {
    rows,
    totalIncome,
    takeHomePay: configValue(values, "takeHomePay"),
    preTaxTotal: configValue(values, "preTaxTotal"),
    traditionalIra: configValue(values, "traditionalIra"),
    federalIncomeTax: configValue(values, "federalIncomeTax"),
    payrollTax: configValue(values, "payrollTax"),
    federalTaxCreditsApplied: configValue(values, "federalTaxCreditsApplied"),
  };
}
