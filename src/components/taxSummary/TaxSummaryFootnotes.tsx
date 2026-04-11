import type { TaxResult } from "~/lib/taxCalc";
import { currencyFormatter } from "~/components/taxSummary/format";

export function TaxSummaryFootnotes(props: { result: TaxResult }) {
  const r = props.result;
  return (
    <>
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
          {r.deductionKind === "itemized"
            ? `itemized ${currencyFormatter.format(r.deductionAmount)}`
            : `standard ${currencyFormatter.format(r.standardDeduction)}`}
          .
        </p>
      </div>
      <p class="text-xs" style={{ color: "var(--text-faint)" }}>
        {r.preTaxTotal > 0 || r.traditionalIra > 0 ? (
          <>
            {r.preTaxTotal > 0 ? (
              <>
                Payroll pre-tax: 401(k) {currencyFormatter.format(r.preTax401k)}
                {" · "}
                HSA {currencyFormatter.format(r.preTaxHsa)}
                {" · "}
                other {currencyFormatter.format(r.preTaxOther)}
              </>
            ) : null}
            {r.preTaxTotal > 0 && r.traditionalIra > 0 ? " · " : null}
            {r.traditionalIra > 0 ? <>IRA {currencyFormatter.format(r.traditionalIra)}</> : null}
            <br />
          </>
        ) : null}
        Federal: ordinary {currencyFormatter.format(r.federalOrdinaryIncomeTax)}
        {" · "}
        long-term capital gain {currencyFormatter.format(r.federalLongTermCapGainsTax)}
        {r.federalNetInvestmentIncomeTax > 0 ? (
          <>
            {" · "}
            NIIT {currencyFormatter.format(r.federalNetInvestmentIncomeTax)}
          </>
        ) : null}
        <br />
        Taxable ordinary {currencyFormatter.format(r.ordinaryTaxableIncome)}
        {" · "}
        taxable LTCG {currencyFormatter.format(r.longTermTaxableIncome)}
        <br />
        Payroll: Social Security {currencyFormatter.format(r.socialSecurityTax)} + Medicare{" "}
        {currencyFormatter.format(r.medicareTax)}
      </p>
    </>
  );
}
