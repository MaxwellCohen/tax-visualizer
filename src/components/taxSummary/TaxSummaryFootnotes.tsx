import type { TaxResult } from "~/lib/taxCalc";
import { currencyFormatter } from "~/components/taxSummary/format";

export function TaxSummaryFootnotes(props: { result: TaxResult }) {
  const r = props.result;
  const hasSE = (r.selfEmploymentIncome ?? 0) > 0;
  const hasSETax = (r.selfEmploymentTax ?? 0) > 0;

  return (
    <>
      <FormulaSection r={r} hasSE={hasSE} />
      <BreakdownSection r={r} hasSE={hasSE} hasSETax={hasSETax} />
    </>
  );
}

function FormulaSection(props: { r: TaxResult; hasSE: boolean }) {
  const r = props.r;
  return (
    <div class="space-y-1.5 text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
      <EffectiveRateFormula hasSE={props.hasSE} />
      <TakeHomeFormula hasSE={props.hasSE} />
      <DeductionFormula r={r} />
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

function DeductionFormula(props: { r: TaxResult }) {
  const deduction = props.r.deductionKind === "itemized"
    ? `itemized ${currencyFormatter.format(props.r.deductionAmount)}`
    : `standard ${currencyFormatter.format(props.r.standardDeduction)}`;
  return (
    <p>
      Deductions shown here are the deduction used by this model: {deduction}.
    </p>
  );
}

function BreakdownSection(props: { r: TaxResult; hasSE: boolean; hasSETax: boolean }) {
  const r = props.r;
  return (
    <p class="text-xs" style={{ color: "var(--text-faint)" }}>
      <PreTaxBreakdown r={r} hasSE={props.hasSE} />
      <FederalBreakdown r={r} />
      <TaxableIncomeBreakdown r={r} />
      <PayrollBreakdown r={r} hasSETax={props.hasSETax} />
    </p>
  );
}

function PreTaxBreakdown(props: { r: TaxResult; hasSE: boolean }) {
  const r = props.r;
  if (r.preTaxTotal <= 0 && r.traditionalIra <= 0 && !props.hasSE) return null;

  return (
    <>
      {props.hasSE && <SelfEmploymentLine r={r} />}
      {r.preTaxTotal > 0 && <PreTaxLine r={r} />}
      {r.traditionalIra > 0 && <IraLine r={r} />}
      <br />
    </>
  );
}

function SelfEmploymentLine(props: { r: TaxResult }) {
  const netSE = props.r.selfEmploymentIncome * 0.9235;
  return (
    <>
      Self-employment: gross {currencyFormatter.format(props.r.selfEmploymentIncome)} → net {currencyFormatter.format(netSE)}
      {(props.r.selfEmploymentTax ?? 0) > 0 ? ` → SE tax ${currencyFormatter.format(props.r.selfEmploymentTax)}` : ""}
      <br />
    </>
  );
}

function PreTaxLine(props: { r: TaxResult }) {
  return (
    <>
      Payroll pre-tax: 401(k) {currencyFormatter.format(props.r.preTax401k)}
      {" · "}HSA {currencyFormatter.format(props.r.preTaxHsa)}
      {" · "}other {currencyFormatter.format(props.r.preTaxOther)}
    </>
  );
}

function IraLine(props: { r: TaxResult }) {
  const r = props.r;
  return (
    <>
      {r.preTaxTotal > 0 ? " · " : null}
      IRA {currencyFormatter.format(r.traditionalIra)}
    </>
  );
}

function FederalBreakdown(props: { r: TaxResult }) {
  const r = props.r;
  const beforeCredits = r.federalTaxCreditsApplied > 0 ? " (before credits)" : "";

  return (
    <>
      Federal{beforeCredits}: ordinary {currencyFormatter.format(r.federalOrdinaryIncomeTax)}
      {" · "}long-term capital gain {currencyFormatter.format(r.federalLongTermCapGainsTax)}
      <NiitLine niit={r.federalNetInvestmentIncomeTax} />
      <CreditsLine r={r} />
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

function CreditsLine(props: { r: TaxResult }) {
  if (props.r.federalTaxCreditsApplied <= 0) return null;
  return (
    <>
      <br />
      Federal credits applied {currencyFormatter.format(props.r.federalTaxCreditsApplied)}; net federal income tax{" "}
      {currencyFormatter.format(props.r.federalIncomeTax)}.
    </>
  );
}

function TaxableIncomeBreakdown(props: { r: TaxResult }) {
  const r = props.r;
  return (
    <>
      Taxable ordinary {currencyFormatter.format(r.ordinaryTaxableIncome)}
      {" · "}taxable LTCG {currencyFormatter.format(r.longTermTaxableIncome)}
      <br />
    </>
  );
}

function PayrollBreakdown(props: { r: TaxResult; hasSETax: boolean }) {
  const r = props.r;
  return (
    <>
      Payroll: Social Security {currencyFormatter.format(r.socialSecurityTax)} + Medicare{" "}
      {currencyFormatter.format(r.medicareTax)}
      {props.hasSETax ? <> SE {currencyFormatter.format(r.selfEmploymentTax)}</> : null}
    </>
  );
}
