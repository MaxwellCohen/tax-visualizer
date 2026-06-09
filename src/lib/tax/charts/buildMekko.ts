import {
  calculatedConfigValuesById,
  type CalculatedConfigItem,
  type CalculatedConfigValueMap,
} from "~/lib/tax/calc/calculateTaxes";
import type { ChartRole } from "~/lib/config/taxPage/types";
import { resolveChartStyle, TAX_CHART_STYLE } from "~/lib/config/taxPage/chart/chartStyle";
import { money } from "~/lib/format/moneyFormat";

const zeroMoneyLabel = money.format(0);

function roundsToNonZeroCurrency(value: number): boolean {
  return money.format(value) !== zeroMoneyLabel;
}

export type MekkoRow = {
  id: string;
  label: string;
  title: string;
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

export type MekkoSummaryData = {
  takeHomeShare: number;
  pretaxShare: number;
  taxShare: number;
  pretaxTotal: number;
  taxTotal: number;
};

const configValue = (values: CalculatedConfigValueMap, id: string): number => values.get(id) ?? 0;

/** Keep from sibling nodes; tax fills remainder so keep + tax === total. */
function keepTaxFromSlice(values: CalculatedConfigValueMap, total: number, keepId: string): { keep: number; tax: number } {
  if (total <= 0) return { keep: 0, tax: 0 };
  const keep = Math.max(0, Math.min(configValue(values, keepId), total));
  const tax = total - keep;
  return { keep, tax };
}

function share(value: number, total: number): number {
  return total > 0 ? Math.max(0, value / total) : 0;
}

function bandTitle(args: { label: string; chartRole: ChartRole; total: number; keep: number; tax: number }): string {
  if (args.chartRole === "pretax") {
    return `${args.label}: ${money.format(args.total)} deferred (payroll pre-tax & deductible IRA).`;
  }
  if (args.chartRole === "seAdjustment") {
    return `${args.label}: ${money.format(args.total)} deductible against ordinary income (not cash).`;
  }
  if (args.chartRole === "payrollTax") {
    return `${args.label}: ${money.format(args.total)} wage Social Security & Medicare.`;
  }
  if (args.chartRole === "deduction") {
    return `${args.label}: ${money.format(args.total)} shielded by standard or itemized deduction.`;
  }
  return `${args.label}: federal tax ${money.format(args.tax)}; ${money.format(args.keep)} remains before payroll tax.`;
}

function rowFromCalculatedItem(item: CalculatedConfigItem, values: CalculatedConfigValueMap): MekkoRow {
  const row = item.mekko!;
  const total = item.computedValue;
  const chartRole = item.chartRole ?? "default";
  const chartStyle = resolveChartStyle(item);

  const { keep, tax } = row.split
    ? keepTaxFromSlice(values, total, row.split.keepId)
    : { keep: total, tax: 0 };

  return {
    id: item.id,
    label: item.labels.compact ?? item.labels.default,
    title: bandTitle({
      label: item.labels.compact ?? item.labels.default,
      chartRole,
      total,
      keep,
      tax,
    }),
    total,
    keep,
    tax,
    chartRole,
    order: row.row,
    ...chartStyle,
    taxFill: TAX_CHART_STYLE.fill,
    taxStroke: TAX_CHART_STYLE.stroke,
  };
}

function compareMekkoRows(a: CalculatedConfigItem, b: CalculatedConfigItem): number {
  const aRow = a.mekko!;
  const bRow = b.mekko!;
  return  aRow.row - bRow.row || a.id.localeCompare(b.id);
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
  summary: MekkoSummaryData;
};

export function buildMekkoFromConfig(cc: CalculatedConfigItem[]): MekkoChartData | undefined {
  const values = calculatedConfigValuesById(cc);
  const rows = cc
    .filter(
      i =>
        i.mekko != null &&
        Number.isFinite(i.mekko.row) &&
        roundsToNonZeroCurrency(i.computedValue),
    )
    .sort(compareMekkoRows)
    .map(item => rowFromCalculatedItem(item, values));

  const stackedTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const totalIncome = configValue(values, "totalIncome");
  if (!rows.length || Math.max(totalIncome, stackedTotal) <= 0) return undefined;

  const takeHomePay = configValue(values, "takeHomePay");
  const preTaxTotal = configValue(values, "preTaxTotal");
  const traditionalIra = configValue(values, "traditionalIra");
  const federalIncomeTax = configValue(values, "federalIncomeTax");
  const payrollTax = configValue(values, "payrollTax");
  const pretaxTotal = preTaxTotal + traditionalIra;
  const taxTotal = federalIncomeTax + payrollTax;

  return {
    rows,
    totalIncome,
    takeHomePay,
    preTaxTotal,
    traditionalIra,
    federalIncomeTax,
    payrollTax,
    federalTaxCreditsApplied: configValue(values, "federalTaxCreditsApplied"),
    summary: {
      takeHomeShare: share(takeHomePay, totalIncome),
      pretaxShare: share(pretaxTotal, totalIncome),
      taxShare: share(taxTotal, totalIncome),
      pretaxTotal,
      taxTotal,
    },
  };
}
