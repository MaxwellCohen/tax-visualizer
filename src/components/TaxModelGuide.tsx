import type { JSX } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import type { TaxResult } from "~/lib/taxForm.types";

type TaxModelGuideProps = {
  result: TaxResult;
  isPlanningYear: boolean;
};

const guideCardShell: JSX.CSSProperties = {
  background: "var(--surface-alt)",
  border: "1px solid var(--border-subtle)",
};

function GuideColumn(props: { title: string; children: JSX.Element }) {
  return (
    <section class="rounded-lg p-4" style={guideCardShell}>
      <h3 class="text-sm font-semibold" style={{ color: "var(--text)" }}>
        {props.title}
      </h3>
      <ul class="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {props.children}
      </ul>
    </section>
  );
}

export default function TaxModelGuide(props: TaxModelGuideProps) {
  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <CollapsibleBlock title="Model guide" bodyClass="mt-4">
        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <GuideColumn title="What this models">
            <li>Federal ordinary income tax brackets (short-term gains use these same rates).</li>
            <li>Long-term capital gains stacked on top of ordinary taxable income.</li>
            <li>Estimated net investment income tax (NIIT) on short- and long-term gains when income exceeds filing thresholds.</li>
            <li>Employee payroll tax on W-2 wages only.</li>
            <li>
              Standard or itemized deductions, pre-tax payroll benefits, and optional deductible traditional IRA
              (year-specific contribution caps).
            </li>
            <li>
              Optional total federal income tax credits, modeled as a simple nonrefundable offset against federal
              income tax (not individual credit rules).
            </li>
          </GuideColumn>

          <GuideColumn title="Product stance">
            <li>
              This tool is an <strong>educational approximation</strong>, not a substitute for a full Form 1040 or
              professional advice. We prioritize clarity and stable charts over matching every IRS worksheet, phase-out,
              and credit ordering rule.
            </li>
            <li>
              Target accuracy: federal brackets, stacking, and payroll at a high level; not exhaustive NIIT/MAGI detail,
              automatic standard-vs-itemized optimization, or refundable credits unless added later.
            </li>
          </GuideColumn>

          <GuideColumn title="What this omits">
            <li>State and local income taxes.</li>
            <li>Credit phase-outs, ordering, refundable credits, full Form 8960 / MAGI detail, AMT, and self-employment tax.</li>
            <li>Employer payroll taxes and withholding timing.</li>
            <li>Return-specific rules that depend on other forms or elections.</li>
          </GuideColumn>

          <GuideColumn title="Why your result may differ">
            {(props.result.notes ?? []).map((note) => (
              <li>{note}</li>
            ))}
            {props.isPlanningYear ? (
              <li>The selected year includes planning figures that may change before filing.</li>
            ) : null}
          </GuideColumn>
        </div>
      </CollapsibleBlock>
    </section>
  );
}
