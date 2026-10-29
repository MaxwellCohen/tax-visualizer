import { getStateYearValues, STATE_NAMES } from "~/lib/config/states/index";
import { STATE_CODES, type StateAmountPair, type StateYearEntry } from "~/lib/config/states/types";
import { ASSUMPTIONS, DISCLAIMER, GLOSSARY, MODELED, OMITTED, PROVENANCE } from "~/routes/about/aboutContent";
import { money } from "~/lib/format/moneyFormat";
import { scheduleFor } from "~/lib/tax/calc/stateIncomeTax";
import { getAvailableTaxYears, getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { FederalTaxBracket, TaxYearConfig } from "~/lib/tax/data/types";
import { FILING_STATUSES } from "~/lib/tax/scenario/scenarioInput";

const bullets = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

const ABOUT_MARKDOWN = `## Methodology (from the About page)

### What the app models

${bullets(MODELED)}

### What it omits

${bullets(OMITTED)}

### Key assumptions

${bullets(ASSUMPTIONS)}

### Data provenance

${PROVENANCE}

### Glossary

${GLOSSARY.map((g) => `- **${g.term}**: ${g.definition}`).join("\n")}

### Disclaimer

${DISCLAIMER}
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
