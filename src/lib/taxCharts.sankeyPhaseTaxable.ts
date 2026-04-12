import type { TaxChartMetrics } from "~/lib/taxForm.types";
import type { TaxResult } from "~/lib/taxForm.types";
import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import {
  allocateProportional,
  allIncomeNodeEntries,
  ltcgIncomeNodeEntries,
  ordinaryIncomeNodeEntries,
} from "~/lib/taxCharts.sankeyAllocate";
import { addNode } from "~/lib/taxCharts.sankeyHelpers";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export function appendSankeyTaxableIncomeNodes(m: TaxChartMetrics, result: TaxResult, s: SankeyScratch): void {
  addLtcgDeductionShield(m, result, s);
  addLongTermTaxableIncome(m, result, s);
  addOrdinaryTaxableIncome(m, result, s);
}

function addLtcgDeductionShield(m: TaxChartMetrics, result: TaxResult, s: SankeyScratch): void {
  const ltcgShieldedByDeduction = Math.max(
    0,
    m.longTermCapitalGainsGrossIncome - m.longTermTaxableIncome,
  );
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

function addLongTermTaxableIncome(m: TaxChartMetrics, result: TaxResult, s: SankeyScratch): void {
  if (m.longTermTaxableIncome <= 0) return;

  addNode(s.nodeMap, {
    id: SANKEY_IDS.longTermTaxableIncome,
    label: "Long-term taxable",
    kind: "longTermTaxableIncome",
    amount: m.longTermTaxableIncome,
  });

  const ltRaw = ltcgIncomeNodeEntries(result);
  const lt = ltRaw.length > 0 ? ltRaw : allIncomeNodeEntries(result);
  createProportionalLinks(s, lt, m.longTermTaxableIncome, SANKEY_IDS.longTermTaxableIncome);
}

function addOrdinaryTaxableIncome(m: TaxChartMetrics, result: TaxResult, s: SankeyScratch): void {
  if (m.ordinaryTaxableIncome <= 0) return;

  const ordinaryTaxableLabel =
    m.shortTermCapGainsGrossIncome > 0
      ? "Ordinary taxable (incl. short-term gains)"
      : "Ordinary taxable";
  addNode(s.nodeMap, {
    id: SANKEY_IDS.ordinaryTaxableIncome,
    label: ordinaryTaxableLabel,
    kind: "ordinaryTaxableIncome",
    amount: m.ordinaryTaxableIncome,
  });

  const ordRaw = ordinaryIncomeNodeEntries(result);
  const ord = ordRaw.length > 0 ? ordRaw : allIncomeNodeEntries(result);
  createProportionalLinks(s, ord, m.ordinaryTaxableIncome, SANKEY_IDS.ordinaryTaxableIncome);

  addPayrollStripIfNeeded(m, s);
}

function createProportionalLinks(
  s: SankeyScratch,
  sourceEntries: { key: string; weight: number }[],
  amount: number,
  targetId: string
): void {
  for (const { key, value } of allocateProportional(sourceEntries, amount)) {
    s.links.push({
      sourceId: key,
      targetId,
      value,
    });
  }
}

function addPayrollStripIfNeeded(m: TaxChartMetrics, s: SankeyScratch): void {
  const hasOrdinaryBrackets = m.ordinaryFederalSegments.length > 0;
  if (!hasOrdinaryBrackets || m.payrollTax <= 0) return;

  const stripVal = Math.min(m.payrollTax, m.ordinaryTaxableIncome);
  const scale = (m.ordinaryTaxableIncome - stripVal) / m.ordinaryTaxableIncome;
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
