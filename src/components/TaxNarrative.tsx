import { Show, createMemo } from "solid-js";
import type { TaxResult } from "~/lib/taxCalc";
import { chartMetricNumeric, deductionKindFromTaxResult } from "~/lib/taxChartMetricRead";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";

type TaxNarrativeProps = {
  result: TaxResult;
  isPlanningYear: boolean;
};

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

export default function TaxNarrative(props: TaxNarrativeProps) {
  const v = createMemo(() => {
    const r = props.result;
    return {
      totalIncome: chartMetricNumeric(r, "totalIncome"),
      preTaxTotal: chartMetricNumeric(r, "preTaxTotal"),
      traditionalIra: chartMetricNumeric(r, "traditionalIra"),
      ordinaryTaxableIncome: chartMetricNumeric(r, "ordinaryTaxableIncome"),
      longTermTaxableIncome: chartMetricNumeric(r, "longTermTaxableIncome"),
      federalIncomeTax: chartMetricNumeric(r, "federalIncomeTax"),
      federalNetInvestmentIncomeTax: chartMetricNumeric(r, "federalNetInvestmentIncomeTax"),
      federalTaxCreditsApplied: chartMetricNumeric(r, "federalTaxCreditsApplied"),
      payrollTax: chartMetricNumeric(r, "payrollTax"),
      takeHomePay: chartMetricNumeric(r, "takeHomePay"),
      effectiveTaxRate: chartMetricNumeric(r, "effectiveTaxRate"),
      deductionAmount: chartMetricNumeric(r, "deductionAmount"),
      standardDeduction: chartMetricNumeric(r, "standardDeduction"),
      itemizedDeductions: chartMetricNumeric(r, "itemizedDeductions"),
    };
  });

  const deductionLabel = () =>
    deductionKindFromTaxResult(props.result) === "itemized"
      ? `itemized deductions of ${money.format(v().itemizedDeductions)}`
      : `the ${money.format(v().standardDeduction)} standard deduction`;

  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <CollapsibleBlock title="Plain-language summary" bodyClass="mt-4">
        <div class="space-y-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <p>
            This scenario starts with {money.format(v().totalIncome)} of gross income. The app treats{" "}
            {money.format(v().preTaxTotal)} as payroll pre-tax withholding
            {v().traditionalIra > 0
              ? ` and ${money.format(v().traditionalIra)} as deductible traditional IRA (outside payroll)`
              : ""}
            , then applies {deductionLabel()} before calculating federal income tax.
          </p>
          <p>
            In this model, {money.format(v().ordinaryTaxableIncome)} is taxed at ordinary federal bracket rates
            (including short-term capital gains, which the IRS taxes like wages under Topic 409), and{" "}
            {money.format(v().longTermTaxableIncome)} is treated as long-term capital gains. Federal income tax is{" "}
            {money.format(v().federalIncomeTax)}
            {v().federalNetInvestmentIncomeTax > 0
              ? ` (including ${money.format(v().federalNetInvestmentIncomeTax)} estimated net investment income tax)`
              : ""}
            <Show when={v().federalTaxCreditsApplied > 0}>
              {`, after ${money.format(v().federalTaxCreditsApplied)} of modeled federal credits`}
            </Show>{" "}
            and payroll tax is {money.format(v().payrollTax)}.
          </p>
          <p>
            The result is {money.format(v().takeHomePay)} of modeled take-home pay, with an effective tax rate of{" "}
            {percent.format(v().effectiveTaxRate)}. That rate is{" "}
            <code>(federal income tax + payroll tax) / (gross income - payroll pre-tax - traditional IRA)</code>, so
            deferred and IRA dollars are not in the denominator (they use a 0% rate in this headline figure).
          </p>
          {props.isPlanningYear ? (
            <p>
              The selected year uses planning figures for inflation-adjusted tax data, so treat it as directional
              rather than final IRS filing guidance.
            </p>
          ) : null}
        </div>
      </CollapsibleBlock>
    </section>
  );
}
