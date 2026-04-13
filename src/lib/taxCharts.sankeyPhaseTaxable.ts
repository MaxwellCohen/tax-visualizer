import type { TaxResult } from "~/lib/taxForm.types";
import { chartMetricNumeric, getOrdinaryFederalSegments } from "~/lib/taxChartMetricRead";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import {
  allocateProportional,
  allIncomeNodeEntries,
  ltcgIncomeNodeEntries,
  ordinaryIncomeNodeEntries,
} from "~/lib/taxCharts.sankeyAllocate";
import { addNode } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export function appendSankeyTaxableIncomeNodes(result: TaxResult, s: SankeyScratch): void {
  addLtcgDeductionShield(result, s);
  addLongTermTaxableIncome(result, s);
  addOrdinaryTaxableIncome(result, s);
}

function addLtcgDeductionShield(result: TaxResult, s: SankeyScratch): void {
  const ltcgGross = chartMetricNumeric(result, "longTermCapitalGainsGrossIncome");
  const ltcgTaxable = chartMetricNumeric(result, "longTermTaxableIncome");
  const ltcgShieldedByDeduction = Math.max(0, ltcgGross - ltcgTaxable);
  if (ltcgShieldedByDeduction <= 0) return;

  addNode(s.nodeMap, {
    id: SANKEY_IDS.ltcgDeductionShield,
    label: "LTCG offset by deduction",
    kind: "ltcgDeductionShield",
    amount: ltcgShieldedByDeduction,
  });

  const ltRaw = ltcgIncomeNodeEntries(result);
  const lt = ltRaw.length > 0 ? ltRaw : allIncomeNodeEntries(result);
  createProportionalLinks(s, lt, ltcgShieldedByDeduction, SANKEY_IDS.ltcgDeductionShield);
}

function addLongTermTaxableIncome(result: TaxResult, s: SankeyScratch): void {
  const longTermTaxableIncome = chartMetricNumeric(result, "longTermTaxableIncome");
  if (longTermTaxableIncome <= 0) return;

  addNode(s.nodeMap, {
    id: SANKEY_IDS.longTermTaxableIncome,
    label: "Long-term taxable",
    kind: "longTermTaxableIncome",
    amount: longTermTaxableIncome,
  });

  const ltRaw = ltcgIncomeNodeEntries(result);
  const lt = ltRaw.length > 0 ? ltRaw : allIncomeNodeEntries(result);
  createProportionalLinks(s, lt, longTermTaxableIncome, SANKEY_IDS.longTermTaxableIncome);
}

function addOrdinaryTaxableIncome(result: TaxResult, s: SankeyScratch): void {
  const ordinaryTaxableIncome = chartMetricNumeric(result, "ordinaryTaxableIncome");
  if (ordinaryTaxableIncome <= 0) return;

  const ordinaryTaxableLabel =
    chartMetricNumeric(result, "shortTermCapGainsGrossIncome") > 0
      ? "Ordinary taxable (incl. short-term gains)"
      : "Ordinary taxable";
  addNode(s.nodeMap, {
    id: SANKEY_IDS.ordinaryTaxableIncome,
    label: ordinaryTaxableLabel,
    kind: "ordinaryTaxableIncome",
    amount: ordinaryTaxableIncome,
  });

  const ordRaw = ordinaryIncomeNodeEntries(result);
  const ord = ordRaw.length > 0 ? ordRaw : allIncomeNodeEntries(result);
  createProportionalLinks(s, ord, ordinaryTaxableIncome, SANKEY_IDS.ordinaryTaxableIncome);

  addPayrollStripIfNeeded(result, s);
}

function createProportionalLinks(
  s: SankeyScratch,
  sourceEntries: { key: string; weight: number }[],
  amount: number,
  targetId: string,
): void {
  for (const { key, value } of allocateProportional(sourceEntries, amount)) {
    s.links.push({
      sourceId: key,
      targetId,
      value,
    });
  }
}

function addPayrollStripIfNeeded(result: TaxResult, s: SankeyScratch): void {
  const hasOrdinaryBrackets = getOrdinaryFederalSegments(result).length > 0;
  const payrollTax = chartMetricNumeric(result, "payrollTax");
  const ordinaryTaxableIncome = chartMetricNumeric(result, "ordinaryTaxableIncome");
  if (!hasOrdinaryBrackets || payrollTax <= 0) return;

  const stripVal = Math.min(payrollTax, ordinaryTaxableIncome);
  const scale = (ordinaryTaxableIncome - stripVal) / ordinaryTaxableIncome;
  if (stripVal <= 0 || scale <= 0.001) return;

  s.payrollTaxViaOrdinaryStrip = true;
  s.payrollStripFlowValue = stripVal;
  s.ordinaryBracketLinkScale = scale;
  addNode(s.nodeMap, {
    id: SANKEY_IDS.payrollOrdinaryStrip,
    label: "Payroll taxes",
    kind: "payrollOrdinaryStrip",
    amount: stripVal,
  });
  s.links.push({
    sourceId: SANKEY_IDS.ordinaryTaxableIncome,
    targetId: SANKEY_IDS.payrollOrdinaryStrip,
    value: stripVal,
  });
}
