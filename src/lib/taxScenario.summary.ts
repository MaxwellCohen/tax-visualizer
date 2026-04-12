import type { TaxResult } from "~/lib/taxCalc.types";

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

export function buildScenarioSummaryText(result: TaxResult): string {
  const incomeParts = result.incomeSources
    .filter(source => source.amount > 0)
    .map(source => `${source.label.trim() || source.kind}: ${money.format(source.amount)}`);

  return [
    `Tax Visualizer scenario (${result.taxYear}, ${result.filingStatus}).`,
    incomeParts.length > 0 ? `Income sources: ${incomeParts.join("; ")}.` : "Income sources: none entered.",
    `Total income ${money.format(result.totalIncome)}. Payroll pre-tax ${money.format(result.preTaxTotal)}; traditional IRA ${money.format(result.traditionalIra)}. Deduction used: ${result.deductionKind} ${money.format(result.deductionAmount)}.`,
    `Federal income tax ${money.format(result.federalIncomeTax)} and payroll tax ${money.format(result.payrollTax)} for an effective tax rate of ${percent.format(result.effectiveTaxRate)} (tax ÷ income after payroll pre-tax and traditional IRA).`,
    `Take-home pay in this model: ${money.format(result.takeHomePay)}.`,
    "This app is educational and omits state tax, detailed credit rules, AMT, and many return-specific adjustments; entered federal credits are a simplified offset; NIIT is only approximated from capital gains.",
  ].join("\n");
}
