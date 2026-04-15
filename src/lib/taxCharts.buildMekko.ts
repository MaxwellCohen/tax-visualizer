import type { TaxResult } from "~/lib/taxForm.types";
import {
  chartMetricNumeric,
  deductionKindFromTaxResult,
  getLtcgBracketItems,
  getOrdinaryBracketItems,
} from "~/lib/taxChartMetricRead";
import type { MekkoRow } from "~/lib/taxCharts.types";

export function buildMekkoRows(result: TaxResult): MekkoRow[] {
  const rows: MekkoRow[] = [];

  const totalIncome = chartMetricNumeric(result, "totalIncome");
  const selfEmploymentTax = chartMetricNumeric(result, "selfEmploymentTax");
  const deductionAmount = chartMetricNumeric(result, "deductionAmount");
  const effectiveDeduction = Math.min(deductionAmount, totalIncome);
  const deductionKeep = Math.max(0, effectiveDeduction - selfEmploymentTax);
  const deductionTax = selfEmploymentTax > 0 ? selfEmploymentTax : 0;

  if (effectiveDeduction > 0) {
    rows.push({
      id: "deduction",
      label: deductionKindFromTaxResult(result) === "itemized" ? "Itemized" : "Standard Deduction",
      total: effectiveDeduction,
      keep: deductionKeep,
      tax: deductionTax,
      kind: "deduction",
    });
  }

  const ordinaryBrackets = getOrdinaryBracketItems(result);
  for (const bracket of ordinaryBrackets) {
    if (bracket.income <= 0) continue;
    const rateLabel = `${Math.round(bracket.marginalRate * 100)}%`;
    rows.push({
      id: bracket.id,
      label: `Ord. ${rateLabel}%`,
      total: bracket.income,
      tax: bracket.tax,
      keep: bracket.keep,
      kind: "ordinaryBracket",
      marginalRate: bracket.marginalRate,
    });
  }

  const ltcgBrackets = getLtcgBracketItems(result);
  for (const bracket of ltcgBrackets) {
    if (bracket.income <= 0) continue;
    const rateLabel = bracket.marginalRate === 0 ? "0%" : `${Math.round(bracket.marginalRate * 100)}%`;
    rows.push({
      id: bracket.id,
      label: `LTCG ${rateLabel}%`,
      total: bracket.income,
      tax: bracket.tax,
      keep: bracket.keep,
      kind: "ltcgBracket",
      marginalRate: bracket.marginalRate,
    });
  }

  const preTaxTotal = chartMetricNumeric(result, "preTaxTotal");
  if (preTaxTotal > 0) {
    rows.push({
      id: "pretax",
      label: "Pre-Tax contributions",
      total: preTaxTotal,
      keep: preTaxTotal,
      tax: 0,
      kind: "pretax",
    });
  }

  return rows;
}
