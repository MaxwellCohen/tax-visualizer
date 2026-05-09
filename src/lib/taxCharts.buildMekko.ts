import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import type { MekkoRowKind, MekkoRowSettings } from "~/lib/config/page/pageConfig.types";

export type MekkoRow = {
  id: string;
  label: string;
  total: number;
  keep: number;
  tax: number;
  kind: MekkoRowKind;
  order: number;
  fill: string;
  stroke: string;
  taxFill: string;
  taxStroke: string;
};

function findConfigValue(cc: CalculatedConfigItem[], id: string): number {
  return cc.find(i => i.id === id)?.computedValue ?? 0;
}

/** Keep from sibling nodes; tax fills remainder so keep + tax === total. */
function keepTaxFromSlice(cc: CalculatedConfigItem[], total: number, keepId: string): { keep: number; tax: number } {
  if (total <= 0) return { keep: 0, tax: 0 };
  const keep = Math.max(0, Math.min(findConfigValue(cc, keepId), total));
  const tax = total - keep;
  return { keep, tax };
}

function rowFromCalculatedItem(item: CalculatedConfigItem, cc: CalculatedConfigItem[]): MekkoRow {
  const row = item.mekkoSettings!.row!;
  const total = item.computedValue;

  const { keep, tax } = row.split
    ? keepTaxFromSlice(cc, total, row.split.keepId)
    : { keep: total, tax: 0 };

  return {
    id: item.id,
    label: item.shortLabel ?? item.label,
    total,
    keep,
    tax,
    kind: row.kind,
    order: row.row,
    fill: row.fill,
    stroke: row.stroke,
    taxFill: row.split?.taxFill ?? "var(--mekko-tax)",
    taxStroke: row.split?.taxStroke ?? "var(--mekko-tax)",
  };
}

function compareMekkoRows(a: CalculatedConfigItem, b: CalculatedConfigItem): number {
  const aRow = a.mekkoSettings!.row as MekkoRowSettings;
  const bRow = b.mekkoSettings!.row as MekkoRowSettings;
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
  const rows = cc
    .filter(i => i.computedValue > 0 && i.mekkoSettings?.row)
    .sort(compareMekkoRows)
    .map(item => rowFromCalculatedItem(item, cc));

  const stackedTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const totalIncome = findConfigValue(cc, "totalIncome");
  if (!rows.length || Math.max(totalIncome, stackedTotal) <= 0) return undefined;

  return {
    rows,
    totalIncome,
    takeHomePay: findConfigValue(cc, "takeHomePay"),
    preTaxTotal: findConfigValue(cc, "preTaxTotal"),
    traditionalIra: findConfigValue(cc, "traditionalIra"),
    federalIncomeTax: findConfigValue(cc, "federalIncomeTax"),
    payrollTax: findConfigValue(cc, "payrollTax"),
    federalTaxCreditsApplied: findConfigValue(cc, "federalTaxCreditsApplied"),
  };
}
