import type { TaxResult } from "~/lib/taxCalc";
import { resolveTaxChartMetrics } from "~/lib/taxResult.resolve";
import type { TaxChartMetrics } from "~/lib/taxForm.types";
import { currencyFormatter } from "~/components/taxSummary/format";

export function TaxSummaryFootnotes(props: { result: TaxResult }) {
  const m = resolveTaxChartMetrics(props.result);
  const hasSE = (m.selfEmploymentIncome ?? 0) > 0;
  const hasSETax = (m.selfEmploymentTax ?? 0) > 0;

  return (
    <>
      <FormulaSection m={m} hasSE={hasSE} />
      <BreakdownSection m={m} hasSE={hasSE} hasSETax={hasSETax} />
    </>
  );
}

function FormulaSection(props: { m: TaxChartMetrics; hasSE: boolean }) {
  const m = props.m;
  return (
    <div class="space-y-1.5 text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
      <EffectiveRateFormula hasSE={props.hasSE} />
      <TakeHomeFormula hasSE={props.hasSE} />
      <DeductionFormula m={m} />
    </div>
  );
}

function EffectiveRateFormula(props: { hasSE: boolean }) {
  const seTerm = props.hasSE ? " + self-employment tax" : "";
  const seDenom = props.hasSE ? " + net SE earnings" : "";
  return (
    <p>
      Effective tax rate ={" "}
      <code>
        (federal income tax + payroll tax{seTerm}) / (gross income - payroll pre-tax - traditional IRA{seDenom})
      </code>
      .
    </p>
  );
}

function TakeHomeFormula(props: { hasSE: boolean }) {
  const seTerm = props.hasSE ? " - self-employment tax" : "";
  return (
    <p>
      Take-home pay ={" "}
      <code>
        gross income - payroll pre-tax - federal income tax - payroll tax{seTerm} - traditional IRA
      </code>
      .
    </p>
  );
}

function DeductionFormula(props: { m: TaxChartMetrics }) {
  const deduction =
    props.m.deductionKind === "itemized"
      ? `itemized ${currencyFormatter.format(props.m.deductionAmount)}`
      : `standard ${currencyFormatter.format(props.m.standardDeduction)}`;
  return (
    <p>
      Deductions shown here are the deduction used by this model: {deduction}.
    </p>
  );
}

function BreakdownSection(props: { m: TaxChartMetrics; hasSE: boolean; hasSETax: boolean }) {
  const m = props.m;
  return (
    <p class="text-xs" style={{ color: "var(--text-faint)" }}>
      <PreTaxBreakdown m={m} hasSE={props.hasSE} />
      <FederalBreakdown m={m} />
      <TaxableIncomeBreakdown m={m} />
      <PayrollBreakdown m={m} hasSETax={props.hasSETax} />
    </p>
  );
}

function PreTaxBreakdown(props: { m: TaxChartMetrics; hasSE: boolean }) {
  const m = props.m;
  if (m.preTaxTotal <= 0 && m.traditionalIra <= 0 && !props.hasSE) return null;

  return (
    <>
      {props.hasSE && <SelfEmploymentLine m={m} />}
      {m.preTaxTotal > 0 && <PreTaxLine m={m} />}
      {m.traditionalIra > 0 && <IraLine m={m} />}
      <br />
    </>
  );
}

function SelfEmploymentLine(props: { m: TaxChartMetrics }) {
  const netSE = props.m.selfEmploymentIncome * 0.9235;
  return (
    <>
      Self-employment: gross {currencyFormatter.format(props.m.selfEmploymentIncome)} → net{" "}
      {currencyFormatter.format(netSE)}
      {(props.m.selfEmploymentTax ?? 0) > 0 ? ` → SE tax ${currencyFormatter.format(props.m.selfEmploymentTax)}` : ""}
      <br />
    </>
  );
}

function PreTaxLine(props: { m: TaxChartMetrics }) {
  return (
    <>
      Payroll pre-tax: 401(k) {currencyFormatter.format(props.m.preTax401k)}
      {" · "}HSA {currencyFormatter.format(props.m.preTaxHsa)}
      {" · "}other {currencyFormatter.format(props.m.preTaxOther)}
    </>
  );
}

function IraLine(props: { m: TaxChartMetrics }) {
  const m = props.m;
  return (
    <>
      {m.preTaxTotal > 0 ? " · " : null}
      IRA {currencyFormatter.format(m.traditionalIra)}
    </>
  );
}

function FederalBreakdown(props: { m: TaxChartMetrics }) {
  const m = props.m;
  const beforeCredits = m.federalTaxCreditsApplied > 0 ? " (before credits)" : "";

  return (
    <>
      Federal{beforeCredits}: ordinary {currencyFormatter.format(m.federalOrdinaryIncomeTax)}
      {" · "}long-term capital gain {currencyFormatter.format(m.federalLongTermCapGainsTax)}
      <NiitLine niit={m.federalNetInvestmentIncomeTax} />
      <CreditsLine m={m} />
      <br />
    </>
  );
}

function NiitLine(props: { niit: number }) {
  if (props.niit <= 0) return null;
  return (
    <>
      {" · "}NIIT {currencyFormatter.format(props.niit)}
    </>
  );
}

function CreditsLine(props: { m: TaxChartMetrics }) {
  if (props.m.federalTaxCreditsApplied <= 0) return null;
  return (
    <>
      <br />
      Federal credits applied {currencyFormatter.format(props.m.federalTaxCreditsApplied)}; net federal income tax{" "}
      {currencyFormatter.format(props.m.federalIncomeTax)}.
    </>
  );
}

function TaxableIncomeBreakdown(props: { m: TaxChartMetrics }) {
  const m = props.m;
  return (
    <>
      Taxable ordinary {currencyFormatter.format(m.ordinaryTaxableIncome)}
      {" · "}taxable LTCG {currencyFormatter.format(m.longTermTaxableIncome)}
      <br />
    </>
  );
}

function PayrollBreakdown(props: { m: TaxChartMetrics; hasSETax: boolean }) {
  const m = props.m;
  return (
    <>
      Payroll: Social Security {currencyFormatter.format(m.socialSecurityTax)} + Medicare{" "}
      {currencyFormatter.format(m.medicareTax)}
      {props.hasSETax ? <> SE {currencyFormatter.format(m.selfEmploymentTax)}</> : null}
    </>
  );
}
