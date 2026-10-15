import type { JSX } from "@solidjs/web";
import { dynamic } from "@solidjs/web";

function AboutBulletCard(props: { title: string; as?: "section" | "div"; children: JSX.Element }) {
  const Tag = dynamic(() => props.as ?? "section");
  return (
    <Tag class="rounded-xl border border-border bg-surface p-5 shadow-card">
      <h2 class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
        {props.title}
      </h2>
      <ul class="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {props.children}
      </ul>
    </Tag>
  );
}

export function AboutModelSections() {
  return (
    <>
      <AboutBulletCard title="What the app models" as="section">
        <li>Federal ordinary income tax brackets for supported filing statuses and tax years.</li>
        <li>Long-term capital gains using 0% / 15% / 20% bands stacked on ordinary taxable income.</li>
        <li>Employee payroll taxes on W-2 wages, including Social Security wage-base limits and Additional Medicare thresholds.</li>
        <li>Self-employment tax on Schedule C–style income, with the deductible half of SE tax.</li>
        <li>Nonrefundable federal credits entered by the user (or child/other-dependent defaults), capped against income tax — no phaseouts.</li>
        <li>Pre-tax payroll benefits, standard deductions, and a single user-entered itemized deduction amount.</li>
      </AboutBulletCard>

      <section class="grid gap-4 lg:grid-cols-2">
        <AboutBulletCard title="What it omits" as="div">
          <li>State and local taxes (as a liability; SALT may appear only as an itemized deduction input).</li>
          <li>Credit phaseouts, refundable credit excess, AMT, Form 8960 / NIIT, qualified business income (section 199A), and other specialized regimes.</li>
          <li>Employer-side payroll taxes and full W-4 / state withholding worksheets (see the simplified paycheck estimator on Withholding).</li>
          <li>Qualified-dividend, collectibles, or other special capital-gain edge cases.</li>
        </AboutBulletCard>

        <AboutBulletCard title="Key assumptions" as="div">
          <li>Payroll pretax (401(k), HSA, FSA) applies to that spouse’s W-2 wages; deductible IRA can reduce self-employment income.</li>
          <li>Deductions are applied to ordinary income first and then to long-term gains.</li>
          <li>The charts show teaching-oriented flows and slices, not a literal Form 1040 line order.</li>
          <li>Planning-year figures may be directional before final IRS guidance is published.</li>
        </AboutBulletCard>
      </section>
    </>
  );
}
