import { getStateYearValues, STATE_NAMES } from "~/lib/config/states/index";
import { STATE_CODES, type StateAmountPair, type StateYearEntry } from "~/lib/config/states/types";
import { money } from "~/lib/format/moneyFormat";
import { scheduleFor } from "~/lib/tax/calc/stateIncomeTax";
import { getAvailableTaxYears, getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { FederalTaxBracket, TaxYearConfig } from "~/lib/tax/data/types";
import { FILING_STATUSES } from "~/lib/tax/scenario/scenarioInput";

/** Mirrors the About page (`src/routes/about/`); keep in sync when methodology copy changes. */
const ABOUT_MARKDOWN = `## Methodology (from the About page)

### What the app models

- Federal ordinary income tax brackets for supported filing statuses and tax years.
- Long-term capital gains using 0% / 15% / 20% bands stacked on ordinary taxable income.
- Employee payroll taxes on W-2 wages, including Social Security wage-base limits and Additional Medicare thresholds.
- Self-employment tax on Schedule C–style income, with the deductible half of SE tax.
- Nonrefundable federal credits entered by the user (or child/other-dependent defaults), capped against income tax — no phaseouts.
- Pre-tax payroll benefits, standard deductions, and a single user-entered itemized deduction amount.
- State income tax for all 50 states and DC: state brackets on federal AGI after the state standard deduction and flat personal / dependent exemptions (or exemption credits), plus capped federal-tax deductions where a state allows them.

### What it omits

- Local and city income taxes, state credits and phaseouts, state-specific income adjustments and itemized deductions, and special regimes such as Washington’s capital gains tax.
- Credit phaseouts, refundable credit excess, AMT, Form 8960 / NIIT, qualified business income (section 199A), and other specialized regimes.
- Employer-side payroll taxes and full W-4 / state withholding worksheets (see the simplified paycheck estimator on Withholding).
- Qualified-dividend, collectibles, or other special capital-gain edge cases.

### Key assumptions

- Payroll pretax (401(k), HSA, FSA) applies to that spouse’s W-2 wages; deductible IRA can reduce self-employment income.
- Deductions are applied to ordinary income first and then to long-term gains.
- The charts show teaching-oriented flows and slices, not a literal Form 1040 line order.
- Planning-year figures may be directional before final IRS guidance is published.
- State rules come from Tax Foundation’s January 1 tables plus known retroactive changes. Married-separate and head-of-household filers use a state’s single schedule unless the state follows the federal standard deduction.

### Disclaimer

For education only, not tax advice. Figures are simplified estimates and may not match your actual liability. If you need filing guidance for a real return, consult a qualified CPA, enrolled agent, or tax attorney.
`;

const pct = (rate: number) => `${+(rate * 100).toFixed(3)}%`;
const row = (cells: (string | number)[]) => `| ${cells.join(" | ")} |`;

function table(header: string[], rows: (string | number)[][]): string {
  return [row(header), row(header.map(() => "---")), ...rows.map(row)].join("\n");
}

function bracketRange(brackets: FederalTaxBracket[], i: number): string {
  const from = i === 0 ? 0 : (brackets[i - 1]?.upTo ?? 0);
  const to = brackets[i]?.upTo;
  return to == null ? `over ${money.format(from)}` : `${money.format(from)} – ${money.format(to)}`;
}

function federalYearMarkdown(year: number, config: TaxYearConfig): string {
  const rates = config.federalBrackets.single.map((b) => b.rate);
  const brackets = table(
    ["Rate", ...FILING_STATUSES],
    rates.map((rate, i) => [
      pct(rate),
      ...FILING_STATUSES.map((s) => bracketRange(config.federalBrackets[s], i)),
    ]),
  );
  const ltcg = table(
    ["LTCG rate", ...FILING_STATUSES],
    (config.longTermCapGains[0]?.brackets ?? []).map((b, i) => [
      pct(b.rate),
      ...FILING_STATUSES.map((s) =>
        bracketRange(config.longTermCapGains.find((t) => t.filingStatus === s)?.brackets ?? [], i),
      ),
    ]),
  );
  const std = table(
    ["", ...FILING_STATUSES],
    [["Standard deduction", ...FILING_STATUSES.map((s) => money.format(config.standardDeduction[s]))]],
  );
  const p = config.payroll;
  return `### ${year}${config.status === "planning" ? " (planning year)" : ""}

Ordinary income brackets (taxable income):

${brackets}

Long-term capital gains (taxable income including gains):

${ltcg}

${std}

Payroll: Social Security ${pct(p.socialSecurityRate)} up to ${money.format(p.socialSecurityWageBase)}; Medicare ${pct(p.medicareRate)} plus ${pct(p.additionalMedicareRate)} Additional Medicare over ${money.format(p.additionalMedicareThreshold.single)} (single) / ${money.format(p.additionalMedicareThreshold.marriedJoint)} (MFJ).
`;
}

function schedule(rows: ReturnType<typeof scheduleFor>): string {
  return rows.map(([over, rate]) => `${pct(rate)} > ${money.format(over)}`).join("; ");
}

function pair(value: StateAmountPair | undefined): string {
  return value ? `${money.format(value[0])} / ${money.format(value[1])}` : "—";
}

function stateRow(code: (typeof STATE_CODES)[number], entry: StateYearEntry | null): string[] {
  const name = `${STATE_NAMES[code]} (${code})`;
  if (!entry) return [name, "No broad-based income tax", "", "—", "—"];
  const single = scheduleFor(entry, "single");
  const joint = scheduleFor(entry, "marriedJoint");
  const exemptions = [
    entry.personalExemption && `personal ${pair(entry.personalExemption)}`,
    entry.dependentExemption && `dependent ${money.format(entry.dependentExemption)}`,
    entry.personalExemptionCredit && `personal credit ${pair(entry.personalExemptionCredit)}`,
    entry.dependentExemptionCredit && `dependent credit ${money.format(entry.dependentExemptionCredit)}`,
  ].filter(Boolean);
  return [
    name,
    schedule(single),
    joint === single ? "same" : schedule(joint),
    entry.standardDeduction === "federal" ? "federal" : pair(entry.standardDeduction),
    exemptions.join("; ") || "—",
  ];
}

function stateYearMarkdown(year: number): string {
  const values = getStateYearValues(year);
  if (!values) return "";
  return `### ${year} state income tax

Brackets are \`rate > over\` on state taxable income. Amount pairs are single / married joint.

${table(
  ["State", "Brackets (single)", "Brackets (married joint)", "Standard deduction", "Exemptions"],
  STATE_CODES.map((code) => stateRow(code, values[code])),
)}
`;
}

/** `llms-full.txt`: `llms.txt` plus About methodology and per-year federal/state tables from the config modules. */
export function buildLlmsFullTxt(llmsTxt: string): string {
  const years = getAvailableTaxYears();
  const federal = years
    .map((year) => {
      const config = getTaxYearConfig(year);
      return config ? federalYearMarkdown(year, config) : "";
    })
    .join("\n");
  const states = years.map(stateYearMarkdown).join("\n");
  return `${llmsTxt.trimEnd()}

${ABOUT_MARKDOWN}
## Federal tax tables

${federal}
## State income tax tables

${states}`;
}
