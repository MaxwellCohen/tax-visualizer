import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import type { MekkoRow } from "~/lib/taxCharts.buildMekko";
import { H, PAD_B, PAD_L, PAD_R, PAD_T, SUMMARY_GAP, SUMMARY_H, W } from "~/components/taxMekko/constants";
import { incomeY, incomeYAxis } from "~/components/taxMekko/incomeScale";

export type MekkoLayout = {
  plotTop: number;
  plotBottom: number;
  plotLeft: number;
  plotRight: number;
  plotW: number;
  plotH: number;
  yMax: number;
  yTicks: number[];
  takeShare: number;
  pretaxShare: number;
  taxShare: number;
  takeHomePay: number;
  preTaxTotal: number;
  traditionalIra: number;
  federalIncomeTax: number;
  payrollTax: number;
  rowLayouts: Array<{
    row: MekkoRow;
    rowTop: number;
    rowH: number;
    keepW: number;
    taxW: number;
    keepFrac: number;
    taxFrac: number;
  }>;
};

function findConfigValue(cc: CalculatedConfigItem[], id: string): number {
  return cc.find(i => i.id === id)?.computedValue ?? 0;
}

export function computeMekkoLayout(cc: CalculatedConfigItem[], rows: MekkoRow[]): MekkoLayout | undefined {
  const totalIncome = findConfigValue(cc, "totalIncome");
  if (rows.length === 0) return undefined;

  
  const visualTotal = totalIncome;
  if (visualTotal <= 0) return undefined;

  const plotTop = PAD_T + SUMMARY_H + SUMMARY_GAP;
  const plotBottom = H - PAD_B;
  const plotLeft = PAD_L;
  const plotRight = W - PAD_R;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;
  const { yMax, yTicks } = incomeYAxis(visualTotal, plotH);

  const takeHomePay = findConfigValue(cc, "takeHomePay");
  const preTaxTotal = findConfigValue(cc, "preTaxTotal");
  const traditionalIra = findConfigValue(cc, "traditionalIra");
  const federalIncomeTax = findConfigValue(cc, "federalIncomeTax");
  const payrollTax = findConfigValue(cc, "payrollTax");

  const takeShare = totalIncome > 0 ? takeHomePay / totalIncome : 0;
  const pretaxShare =
    totalIncome > 0
      ? (preTaxTotal + traditionalIra) / totalIncome
      : 0;
  const taxShare =
    totalIncome > 0
      ? (federalIncomeTax + payrollTax) / totalIncome
      : 0;

  let cumulative = 0;
  const rowLayouts = rows.map((row: MekkoRow) => {
    const y0 = incomeY(plotTop, plotH, yMax, cumulative);
    cumulative += row.total;
    const y1 = incomeY(plotTop, plotH, yMax, cumulative);
    const rowTop = Math.min(y0, y1);
    const rowH = Math.max(1, Math.abs(y1 - y0));
    const keepFrac = row.total > 0 ? row.keep / row.total : 0;
    const taxFrac = row.total > 0 ? row.tax / row.total : 0;
    const keepW = keepFrac * plotW;
    const taxW = taxFrac * plotW;
    return { row, rowTop, rowH, keepW, taxW, keepFrac, taxFrac };
  });

  return {
    plotTop,
    plotBottom,
    plotLeft,
    plotRight,
    plotW,
    plotH,
    yMax,
    yTicks,
    takeShare,
    pretaxShare,
    taxShare,
    takeHomePay,
    preTaxTotal,
    traditionalIra,
    federalIncomeTax,
    payrollTax,
    rowLayouts,
  };
}
