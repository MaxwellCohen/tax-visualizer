export function AboutProvenanceAndGlossary() {
  return (
    <>
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
    </>
  );
}
