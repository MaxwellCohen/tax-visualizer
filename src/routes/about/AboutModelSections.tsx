import type { JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

const aboutCardStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  "box-shadow": "var(--shadow-card)",
} as const;

const aboutHeadingStyle = {
  color: "var(--color-faint-foreground)",
  "font-family": "var(--font-heading)",
} as const;

function AboutBulletCard(props: { title: string; as?: "section" | "div"; children: JSX.Element }) {
  return (
    <Dynamic component={props.as ?? "section"} class="rounded-xl p-5" style={aboutCardStyle}>
      <h2
        class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={aboutHeadingStyle}
      >
        {props.title}
      </h2>
      <ul class="space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
        {props.children}
      </ul>
    </Dynamic>
  );
}

export function AboutModelSections() {
  return (
    <>
      <AboutBulletCard title="What the app models" as="section">
        <li>Federal ordinary income tax brackets for supported filing statuses and tax years.</li>
        <li>Long-term capital gains using 0% / 15% / 20% bands stacked on ordinary taxable income.</li>
        <li>Employee payroll taxes on W-2 wages, including Social Security wage-base limits and Additional Medicare thresholds.</li>
        <li>Pre-tax payroll benefits, standard deductions, and a single user-entered itemized deduction amount.</li>
      </AboutBulletCard>

      <section class="grid gap-4 lg:grid-cols-2">
        <AboutBulletCard title="What it omits" as="div">
          <li>State and local taxes.</li>
          <li>Credits, phaseouts, AMT, full Form 8960 / NIIT detail, self-employment tax, and other specialized regimes.</li>
          <li>Employer-side payroll taxes, withholding schedules, and refund timing.</li>
          <li>Qualified-dividend, collectibles, or other special capital-gain edge cases.</li>
        </AboutBulletCard>

        <AboutBulletCard title="Key assumptions" as="div">
          <li>Pre-tax payroll entries only apply to W-2 wages in the model.</li>
          <li>Deductions are applied to ordinary income first and then to long-term gains.</li>
          <li>The charts show teaching-oriented flows and slices, not a literal Form 1040 line order.</li>
          <li>Planning-year figures may be directional before final IRS guidance is published.</li>
        </AboutBulletCard>
      </section>
    </>
  );
}
