import type { TaxResult } from "~/lib/taxCalc";
import { currencyFormatter, deltaLabel, percentFormatter } from "~/components/taxSummary/format";
import { TaxSummaryFootnotes } from "~/components/taxSummary/TaxSummaryFootnotes";
import { TaxSummaryMetric } from "~/components/taxSummary/TaxSummaryMetric";

type TaxSummaryProps = {
  result: TaxResult;
  baselineResult?: TaxResult | null;
};

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
        <TaxSummaryMetric label="Total Income" value={currencyFormatter.format(props.result.totalIncome)} />
        <TaxSummaryMetric label="Payroll pre-tax" value={currencyFormatter.format(props.result.preTaxTotal)} />
        <TaxSummaryMetric
          label="Traditional IRA"
          value={currencyFormatter.format(props.result.traditionalIra)}
        />
        <TaxSummaryMetric label="Federal Income Tax" value={currencyFormatter.format(props.result.federalIncomeTax)} />
        <TaxSummaryMetric label="Payroll Taxes" value={currencyFormatter.format(props.result.payrollTax)} />
        <TaxSummaryMetric label="Deductions" value={currencyFormatter.format(props.result.deductionAmount)} />
        <TaxSummaryMetric label="Take-Home Pay" value={currencyFormatter.format(props.result.takeHomePay)} highlight />
        <TaxSummaryMetric label="Effective Tax Rate" value={percentFormatter.format(props.result.effectiveTaxRate)} highlight />
      </div>
      {baseline() ? (
        <div class="grid gap-3 md:grid-cols-3">
          <TaxSummaryMetric
            label="Vs baseline take-home"
            value={deltaLabel(props.result.takeHomePay, baseline()!.takeHomePay, currencyFormatter)}
            highlight
          />
          <TaxSummaryMetric
            label="Vs baseline federal tax"
            value={deltaLabel(
              props.result.federalIncomeTax,
              baseline()!.federalIncomeTax,
              currencyFormatter,
            )}
          />
          <TaxSummaryMetric
            label="Vs baseline payroll tax"
            value={deltaLabel(props.result.payrollTax, baseline()!.payrollTax, currencyFormatter)}
          />
        </div>
      ) : null}
      <TaxSummaryFootnotes result={props.result} />
    </section>
  );
}
