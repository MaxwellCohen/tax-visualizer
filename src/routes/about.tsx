import { A } from "@solidjs/router";

export default function About() {
  return (
    <main class="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <header class="space-y-3">
        <h1
          class="text-4xl font-semibold tracking-tight"
          style={{ "font-family": "var(--font-heading)", color: "var(--text)" }}
        >
          About &amp; methodology
        </h1>
        <p class="max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Tax Visualizer is an educational US federal tax explainer built with{" "}
          <a
            href="https://solidjs.com"
            target="_blank"
            rel="noopener noreferrer"
            class="underline underline-offset-2 transition-colors duration-150"
            style={{ color: "var(--accent)" }}
          >
            SolidStart
          </a>
          . It is designed to show why a scenario produces a result, not to replace a real tax
          return or professional advice.
        </p>
      </header>

      <section
        class="rounded-xl p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", "box-shadow": "var(--shadow)" }}
      >
        <h2
          class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
        >
          What the app models
        </h2>
        <ul class="space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <li>Federal ordinary income tax brackets for supported filing statuses and tax years.</li>
          <li>Long-term capital gains using 0% / 15% / 20% bands stacked on ordinary taxable income.</li>
          <li>Employee payroll taxes on W-2 wages, including Social Security wage-base limits and Additional Medicare thresholds.</li>
          <li>Pre-tax payroll benefits, standard deductions, and a single user-entered itemized deduction amount.</li>
        </ul>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div
          class="rounded-xl p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", "box-shadow": "var(--shadow)" }}
        >
          <h2
            class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
          >
            What it omits
          </h2>
          <ul class="space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <li>State and local taxes.</li>
            <li>Credits, phaseouts, AMT, full Form 8960 / NIIT detail, self-employment tax, and other specialized regimes.</li>
            <li>Employer-side payroll taxes, withholding schedules, and refund timing.</li>
            <li>Qualified-dividend, collectibles, or other special capital-gain edge cases.</li>
          </ul>
        </div>

        <div
          class="rounded-xl p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", "box-shadow": "var(--shadow)" }}
        >
          <h2
            class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
          >
            Key assumptions
          </h2>
          <ul class="space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <li>Pre-tax payroll entries only apply to W-2 wages in the model.</li>
            <li>Deductions are applied to ordinary income first and then to long-term gains.</li>
            <li>The charts show teaching-oriented flows and slices, not a literal Form 1040 line order.</li>
            <li>Planning-year figures may be directional before final IRS guidance is published.</li>
          </ul>
        </div>
      </section>

      <section
        class="rounded-xl p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", "box-shadow": "var(--shadow)" }}
      >
        <h2
          class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
        >
          Data provenance
        </h2>
        <p class="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          The supported tax years in the app are sourced from federal bracket, deduction, long-term
          capital-gain, and payroll-tax tables encoded in the app itself. Final-year values reflect
          published inflation adjustments; planning-year values are labeled in the interface so you
          can distinguish them from final filing guidance.
        </p>
      </section>

      <section
        class="rounded-xl p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", "box-shadow": "var(--shadow)" }}
      >
        <h2
          class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
        >
          Glossary
        </h2>
        <dl class="grid gap-4 md:grid-cols-2">
          <div>
            <dt class="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Effective tax rate
            </dt>
            <dd class="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              In this app: federal income tax plus payroll tax, divided by total income.
            </dd>
          </div>
          <div>
            <dt class="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Take-home pay
            </dt>
            <dd class="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Gross income minus modeled pre-tax benefits, federal income tax, and payroll tax.
            </dd>
          </div>
          <div>
            <dt class="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Ordinary taxable income
            </dt>
            <dd class="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Wages, other ordinary income, and short-term gains remaining after modeled deductions.
            </dd>
          </div>
          <div>
            <dt class="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Long-term taxable income
            </dt>
            <dd class="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Long-term capital gains remaining after any deduction that is left over after reducing ordinary income.
            </dd>
          </div>
        </dl>
      </section>

      <section
        class="rounded-xl p-5 text-sm leading-relaxed"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", "box-shadow": "var(--shadow)", color: "var(--text-muted)" }}
      >
        For education only, not tax advice. If you need filing guidance for a real return, consult a
        qualified CPA, enrolled agent, or tax attorney.
      </section>

      <div class="flex items-center gap-4 text-sm" style={{ color: "var(--text-faint)" }}>
        <A
          href="/"
          class="underline underline-offset-2 transition-colors duration-150"
          style={{ color: "var(--accent)" }}
        >
          Home
        </A>
        <span aria-hidden="true">&middot;</span>
        <span>About &amp; methodology</span>
      </div>
    </main>
  );
}
