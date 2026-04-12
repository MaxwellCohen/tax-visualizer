import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { incomeSourceDisplayLabel } from "~/lib/taxCalc.labeledAmountSource";
import type { TaxFormIncomeRow, TaxFormRow, TaxResult } from "~/lib/taxForm.types";
import { isFormRow } from "~/lib/taxForm.types";
import { resolveTaxChartMetrics } from "~/lib/taxResult.resolve";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formRowsOnly(rows: TaxResult["rows"]): TaxFormRow[] {
  return rows.filter((r): r is TaxFormRow => isFormRow(r));
}

export function buildScenarioSummaryText(result: TaxResult): string {
  const formRows = formRowsOnly(result.rows);
  const m = resolveTaxChartMetrics(result);
  const taxYear = getTaxYearFromRows(formRows);
  const filingStatus = getFilingStatusFromRows(formRows);

  const incomeParts = formRows
    .filter((r): r is TaxFormIncomeRow => r.type === "income" && r.amount > 0)
    .map((source) => `${source.label.trim() || incomeSourceDisplayLabel(source)}: ${money.format(source.amount)}`);

  return [
    `Tax Visualizer scenario (${taxYear}, ${filingStatus}).`,
    incomeParts.length > 0 ? `Income sources: ${incomeParts.join("; ")}.` : "Income sources: none entered.",
    `Total income ${money.format(m.totalIncome)}. Payroll pre-tax ${money.format(m.preTaxTotal)}; traditional IRA ${money.format(m.traditionalIra)}. Deduction used: ${m.deductionKind} ${money.format(m.deductionAmount)}.`,
    `Federal income tax ${money.format(m.federalIncomeTax)} and payroll tax ${money.format(m.payrollTax)} for an effective tax rate of ${percent.format(m.effectiveTaxRate)} (tax ÷ income after payroll pre-tax and traditional IRA).`,
    `Take-home pay in this model: ${money.format(m.takeHomePay)}.`,
    "This app is educational and omits state tax, detailed credit rules, AMT, and many return-specific adjustments; entered federal credits are a simplified offset; NIIT is only approximated from capital gains.",
  ].join("\n");
}
