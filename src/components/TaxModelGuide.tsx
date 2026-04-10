import type { TaxResult } from "~/lib/taxCalc";

type TaxModelGuideProps = {
  result: TaxResult;
  isPlanningYear: boolean;
};

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
      <h2
        class="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Model guide
      </h2>
      <div class="grid gap-4 lg:grid-cols-3">
        <section
          class="rounded-lg p-4"
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border-subtle)" }}
        >
          <h3 class="text-sm font-semibold" style={{ color: "var(--text)" }}>
            What this models
          </h3>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <li>Federal ordinary income tax brackets (short-term gains use these same rates).</li>
            <li>Long-term capital gains stacked on top of ordinary taxable income.</li>
            <li>Estimated net investment income tax (NIIT) on short- and long-term gains when income exceeds filing thresholds.</li>
            <li>Employee payroll tax on W-2 wages only.</li>
            <li>
              Standard or itemized deductions, pre-tax payroll benefits, and optional deductible traditional
              IRA (year-specific contribution caps).
            </li>
          </ul>
        </section>

        <section
          class="rounded-lg p-4"
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border-subtle)" }}
        >
          <h3 class="text-sm font-semibold" style={{ color: "var(--text)" }}>
            What this omits
          </h3>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <li>State and local income taxes.</li>
            <li>Credits, phaseouts, full Form 8960 / MAGI detail, AMT, and self-employment tax.</li>
            <li>Employer payroll taxes and withholding timing.</li>
            <li>Return-specific rules that depend on other forms or elections.</li>
          </ul>
        </section>

        <section
          class="rounded-lg p-4"
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border-subtle)" }}
        >
          <h3 class="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Why your result may differ
          </h3>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {props.result.notes.map(note => (
              <li>{note}</li>
            ))}
            {props.isPlanningYear ? (
              <li>The selected year includes planning figures that may change before filing.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </section>
  );
}
