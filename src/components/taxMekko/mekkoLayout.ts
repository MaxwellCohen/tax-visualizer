import type { TaxChartMetrics } from "~/lib/taxForm.types";
import type { MekkoRow } from "~/lib/taxCharts";
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

export function computeMekkoLayout(m: TaxChartMetrics, rows: MekkoRow[]): MekkoLayout | undefined {
  const totalIncome = m.totalIncome;
  if (rows.length === 0) return undefined;

  const stackTotal = rows.reduce((s, row) => s + row.total, 0);
  const visualTotal = Math.max(totalIncome, stackTotal);
  if (visualTotal <= 0) return undefined;

  const plotTop = PAD_T + SUMMARY_H + SUMMARY_GAP;
  const plotBottom = H - PAD_B;
  const plotLeft = PAD_L;
  const plotRight = W - PAD_R;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;
  const { yMax, yTicks } = incomeYAxis(visualTotal, plotH);

  const takeShare = totalIncome > 0 ? m.takeHomePay / totalIncome : 0;
  const pretaxShare =
    totalIncome > 0 ? (m.preTaxTotal + m.traditionalIra) / totalIncome : 0;
  const taxShare =
    totalIncome > 0 ? (m.federalIncomeTax + m.payrollTax) / totalIncome : 0;

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
    rowLayouts,
  };
}
