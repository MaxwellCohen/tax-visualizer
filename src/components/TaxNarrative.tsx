import type { TaxResult } from "~/lib/taxCalc";

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
  const result = () => props.result;
  const deductionLabel = () =>
    result().deductionKind === "itemized"
      ? `itemized deductions of ${money.format(result().deductionAmount)}`
      : `the ${money.format(result().standardDeduction)} standard deduction`;

  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <h2
        class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Plain-language summary
      </h2>
      <div class="space-y-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        <p>
          This scenario starts with {money.format(result().totalIncome)} of gross income. The app
          treats {money.format(result().preTaxTotal)} as payroll pre-tax withholding
          {result().traditionalIra > 0
            ? ` and ${money.format(result().traditionalIra)} as deductible traditional IRA (outside payroll)`
            : ""}
          , then applies {deductionLabel()} before calculating federal income tax.
        </p>
        <p>
          In this model, {money.format(result().ordinaryTaxableIncome)} is taxed at ordinary federal
          bracket rates (including short-term capital gains, which the IRS taxes like wages under
          Topic 409), and {money.format(result().longTermTaxableIncome)} is treated as long-term
          capital gains. Federal income tax is {money.format(result().federalIncomeTax)}
          {result().federalNetInvestmentIncomeTax > 0
            ? ` (including ${money.format(result().federalNetInvestmentIncomeTax)} estimated net investment income tax)`
            : ""}{" "}
          and payroll tax is {money.format(result().payrollTax)}.
        </p>
        <p>
          The result is {money.format(result().takeHomePay)} of modeled take-home pay, with an
          effective tax rate of {percent.format(result().effectiveTaxRate)}. That effective rate is
          just <code>(federal income tax + payroll tax) / total income</code>.
        </p>
        {props.isPlanningYear ? (
          <p>
            The selected year uses planning figures for inflation-adjusted tax data, so treat it as
            directional rather than final IRS filing guidance.
          </p>
        ) : null}
      </div>
    </section>
  );
}
