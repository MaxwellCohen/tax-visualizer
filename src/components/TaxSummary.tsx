import type { TaxResult } from "~/lib/taxCalc";

type TaxSummaryProps = {
  result: TaxResult;
  baselineResult?: TaxResult | null;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function Metric(props: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      class="rounded-lg p-4"
      style={{
        background: props.highlight ? "var(--accent-muted)" : "var(--surface-alt)",
      }}
    >
      <p
        class="text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--text-faint)" }}
      >
        {props.label}
      </p>
      <p
        class="mt-1.5 text-xl font-semibold"
        style={{
          color: props.highlight ? "var(--accent)" : "var(--text)",
          "font-family": "var(--font-heading)",
        }}
      >
        {props.value}
      </p>
    </div>
  );
}

function deltaLabel(current: number, baseline: number, formatter: Intl.NumberFormat): string {
  const delta = current - baseline;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatter.format(delta)}`;
}

export default function TaxSummary(props: TaxSummaryProps) {
  const baseline = () => props.baselineResult ?? null;
  return (
    <section
      class="space-y-4 rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <h2
        class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Tax Summary
      </h2>
      <div class="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Metric label="Total Income" value={currencyFormatter.format(props.result.totalIncome)} />
        <Metric label="Payroll pre-tax" value={currencyFormatter.format(props.result.preTaxTotal)} />
        <Metric
          label="Traditional IRA"
          value={currencyFormatter.format(props.result.traditionalIra)}
        />
        <Metric label="Federal Income Tax" value={currencyFormatter.format(props.result.federalIncomeTax)} />
        <Metric label="Payroll Taxes" value={currencyFormatter.format(props.result.payrollTax)} />
        <Metric label="Deductions" value={currencyFormatter.format(props.result.deductionAmount)} />
        <Metric label="Take-Home Pay" value={currencyFormatter.format(props.result.takeHomePay)} highlight />
        <Metric label="Effective Tax Rate" value={percentFormatter.format(props.result.effectiveTaxRate)} highlight />
      </div>
      {baseline() ? (
        <div class="grid gap-3 md:grid-cols-3">
          <Metric
            label="Vs baseline take-home"
            value={deltaLabel(props.result.takeHomePay, baseline()!.takeHomePay, currencyFormatter)}
            highlight
          />
          <Metric
            label="Vs baseline federal tax"
            value={deltaLabel(
              props.result.federalIncomeTax,
              baseline()!.federalIncomeTax,
              currencyFormatter,
            )}
          />
          <Metric
            label="Vs baseline payroll tax"
            value={deltaLabel(props.result.payrollTax, baseline()!.payrollTax, currencyFormatter)}
          />
        </div>
      ) : null}
      <div class="space-y-1.5 text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
        <p>
          Effective tax rate = <code>(federal income tax + payroll tax) / total income</code>.
        </p>
        <p>
          Take-home pay ={" "}
          <code>
            gross income - payroll pre-tax - federal income tax - payroll tax - traditional IRA
          </code>
          .
        </p>
        <p>
          Deductions shown here are the deduction used by this model:{" "}
          {props.result.deductionKind === "itemized"
            ? `itemized ${currencyFormatter.format(props.result.deductionAmount)}`
            : `standard ${currencyFormatter.format(props.result.standardDeduction)}`}
          .
        </p>
      </div>
      <p class="text-xs" style={{ color: "var(--text-faint)" }}>
        {props.result.preTaxTotal > 0 || props.result.traditionalIra > 0 ? (
          <>
            {props.result.preTaxTotal > 0 ? (
              <>
                Payroll pre-tax: 401(k) {currencyFormatter.format(props.result.preTax401k)}
                {" · "}
                HSA {currencyFormatter.format(props.result.preTaxHsa)}
                {" · "}
                other {currencyFormatter.format(props.result.preTaxOther)}
              </>
            ) : null}
            {props.result.preTaxTotal > 0 && props.result.traditionalIra > 0 ? " · " : null}
            {props.result.traditionalIra > 0 ? (
              <>IRA {currencyFormatter.format(props.result.traditionalIra)}</>
            ) : null}
            <br />
          </>
        ) : null}
        Federal: ordinary {currencyFormatter.format(props.result.federalOrdinaryIncomeTax)}
        {" · "}
        long-term capital gain {currencyFormatter.format(props.result.federalLongTermCapGainsTax)}
        {props.result.federalNetInvestmentIncomeTax > 0 ? (
          <>
            {" · "}
            NIIT {currencyFormatter.format(props.result.federalNetInvestmentIncomeTax)}
          </>
        ) : null}
        <br />
        Taxable ordinary {currencyFormatter.format(props.result.ordinaryTaxableIncome)}
        {" · "}
        taxable LTCG {currencyFormatter.format(props.result.longTermTaxableIncome)}
        <br />
        Payroll: Social Security {currencyFormatter.format(props.result.socialSecurityTax)} + Medicare{" "}
        {currencyFormatter.format(props.result.medicareTax)}
      </p>
    </section>
  );
}
