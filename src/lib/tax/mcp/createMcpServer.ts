import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { isStateCode } from "~/lib/config/states/index";
import { SITE_NAME } from "~/lib/site/meta";
import { calculateScenario, type ScenarioSummary } from "~/lib/tax/api/calculateScenario";
import { getApiCatalog, getFederalYearConfig, getStateYearConfig } from "~/lib/tax/api/catalog";
import { buildLlmsFullTxt } from "~/lib/tax/api/llmsFull";
import { GLOSSARY } from "~/routes/about/aboutContent";
import { scenarioInputToTaxFormData, validateScenarioInput } from "~/lib/tax/scenario/scenarioInput";
import { computeWithholdingEstimate } from "~/lib/tax/withholding/computeWithholdingEstimate";
import { deriveWageJobsFromTaxInput } from "~/lib/tax/withholding/wageJobs";

export type McpServerOptions = {
  /** Raw `public/llms.txt`, used to build the `taxviz://llms-full` resource. */
  llmsTxt: string;
  /** Request origin (e.g. `https://example.com`) used to make `shareUrl` absolute. */
  origin?: string;
};

const SCOPE =
  "All amounts are annual USD. Out of scope: state phaseouts, other state credits, and local taxes. " +
  "Educational estimate, not tax advice.";
const ANNOTATIONS = { readOnlyHint: true, openWorldHint: false } as const;

const scenarioShape = {
  year: z.number().int().describe("Tax year; see list_supported_options."),
  filingStatus: z
    .string()
    .optional()
    .describe("single | marriedJoint | marriedSeparate | headOfHousehold (default single)."),
  state: z.string().optional().describe('Two-letter residence state (e.g. "CA") or "none" (default).'),
  qualifyingChildren: z.number().optional().describe("Qualifying children for the child tax credit."),
  otherDependents: z.number().optional().describe("Other dependents."),
  itemize: z.boolean().optional().describe("Use itemized deductions instead of the standard deduction."),
  lineItems: z
    .record(z.string(), z.number())
    .optional()
    .describe(
      'Annual USD amounts keyed by alias or id, e.g. {"wages":90000,"401k":10000}. Call list_supported_options for all ids.',
    ),
};
const scenarioSchema = z.object(scenarioShape);

const ok = (data: Record<string, unknown>): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  structuredContent: data,
});
const fail = (errors: string[]): CallToolResult => ({
  isError: true,
  content: [{ type: "text", text: `Invalid input:\n${errors.map((e) => `- ${e}`).join("\n")}` }],
});

const withOrigin = (summary: ScenarioSummary, origin?: string): ScenarioSummary =>
  origin ? { ...summary, shareUrl: new URL(summary.shareUrl, origin).toString() } : summary;

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;
const diff = (a: number, b: number, round = round2) => ({ a, b, delta: round(b - a) });

const payFrequency = z.enum(["weekly", "biweekly", "semi-monthly", "monthly"]);

/** Fresh stateless MCP server wrapping the public API logic; create one per request. */
let llmsFullCache: { source: string; text: string } | undefined;
const getLlmsFull = (llmsTxt: string) => {
  if (llmsFullCache?.source !== llmsTxt) llmsFullCache = { source: llmsTxt, text: buildLlmsFullTxt(llmsTxt) };
  return llmsFullCache.text;
};

export function createMcpServer({ llmsTxt, origin }: McpServerOptions): McpServer {
  const server = new McpServer({ name: SITE_NAME, version: "1.0.0" });

  server.registerTool(
    "calculate_taxes",
    {
      title: "Calculate taxes",
      description: `Estimate US federal income tax, state income tax, payroll/self-employment tax, total tax, and take-home pay for one scenario. ${SCOPE}`,
      inputSchema: scenarioShape,
      annotations: ANNOTATIONS,
    },
    (args) => {
      const result = calculateScenario(args);
      return result.ok ? ok(withOrigin(result.value, origin)) : fail(result.errors);
    },
  );

  server.registerTool(
    "compare_scenarios",
    {
      title: "Compare scenarios",
      description: `Calculate two scenarios (a and b) and return both summaries plus a delta (b minus a) for total tax, federal, state, payroll, take-home, and effective rates. ${SCOPE}`,
      inputSchema: { a: scenarioSchema, b: scenarioSchema },
      annotations: ANNOTATIONS,
    },
    ({ a, b }) => {
      const ra = calculateScenario(a);
      const rb = calculateScenario(b);
      const errors = [
        ...(ra.ok ? [] : ra.errors.map((e) => `a: ${e}`)),
        ...(rb.ok ? [] : rb.errors.map((e) => `b: ${e}`)),
      ];
      if (!ra.ok || !rb.ok) return fail(errors);
      const [sa, sb] = [ra.value, rb.value];
      return ok({
        a: withOrigin(sa, origin),
        b: withOrigin(sb, origin),
        delta: {
          totalTax: diff(sa.totalTax, sb.totalTax),
          federalIncomeTax: diff(sa.federalIncomeTax, sb.federalIncomeTax),
          stateIncomeTax: diff(sa.stateIncomeTax, sb.stateIncomeTax),
          payrollTaxes: diff(sa.payrollTaxes.total, sb.payrollTaxes.total),
          takeHomePay: diff(sa.takeHomePay, sb.takeHomePay),
          effectiveIncomeTaxRate: diff(sa.rates.effectiveIncomeTaxRate, sb.rates.effectiveIncomeTaxRate, round4),
          effectiveTotalTaxRate: diff(sa.rates.effectiveTotalTaxRate, sb.rates.effectiveTotalTaxRate, round4),
        },
      });
    },
  );

  server.registerTool(
    "get_tax_brackets",
    {
      title: "Get tax brackets",
      description: `Federal brackets, standard deduction, and long-term capital gains bands for a year; with a state code, that state's income tax rules instead. ${SCOPE}`,
      inputSchema: {
        year: z.number().int().describe("Tax year; see list_supported_options."),
        state: z.string().optional().describe('Two-letter state code (e.g. "CA"). Omit for federal.'),
      },
      annotations: ANNOTATIONS,
    },
    ({ year, state }) => {
      if (state !== undefined) {
        const code = state.toUpperCase();
        const config = getStateYearConfig(year);
        if (!config || !isStateCode(code)) {
          return fail([
            !config ? `year ${year} is not supported.` : `state must be a two-letter code such as CA, got "${state}".`,
          ]);
        }
        return ok({ year, state: code, ...config.states[code]! });
      }
      const config = getFederalYearConfig(year);
      if (!config) return fail([`year ${year} is not supported.`]);
      const { federalBrackets, standardDeduction, longTermCapGains, payroll, status } = config;
      return ok({ year, status, federalBrackets, standardDeduction, longTermCapGains, payroll });
    },
  );

  server.registerTool(
    "list_supported_options",
    {
      title: "List supported options",
      description:
        "List supported tax years, filing statuses, states, and accepted line-item ids/aliases with labels and descriptions. Amounts are annual USD.",
      annotations: ANNOTATIONS,
    },
    () => ok(getApiCatalog()),
  );

  server.registerTool(
    "estimate_withholding",
    {
      title: "Estimate federal withholding",
      description:
        `Suggest federal income tax withholding per paycheck for each W-2 job in a scenario, and (if withheld per paycheck is given) the estimated year-end refund (positive) or balance due (negative). Jobs follow wage line items in order: "wages", then "wages2". Federal only; state tax is not withheld here. ${SCOPE}`,
      inputSchema: {
        ...scenarioShape,
        jobs: z
          .array(
            z.object({
              payFrequency: payFrequency.optional().describe("Default biweekly."),
              federalWithheldPerPaycheck: z.number().optional().describe("USD currently withheld per paycheck."),
            }),
          )
          .optional()
          .describe("Per-job pay settings, aligned with wage jobs in order."),
      },
      annotations: ANNOTATIONS,
    },
    ({ jobs = [], ...scenario }) => {
      const validated = validateScenarioInput(scenario);
      if (!validated.ok) return fail(validated.errors);
      const result = calculateScenario(scenario);
      if (!result.ok) return fail(result.errors);
      const wageJobs = deriveWageJobsFromTaxInput(scenarioInputToTaxFormData(validated.value));
      if (wageJobs.length === 0) return fail(["No W-2 wage line items (wages, wages2) in this scenario."]);
      const estimate = computeWithholdingEstimate(result.value.federalIncomeTax, wageJobs, {
        jobs: wageJobs.map((job, i) => ({
          incomeRowId: job.incomeRowId,
          payFrequency: jobs[i]?.payFrequency ?? "biweekly",
          federalWithheldPerPaycheck: jobs[i]?.federalWithheldPerPaycheck,
        })),
      });
      return ok(estimate);
    },
  );

  server.registerResource(
    "llms-full",
    "taxviz://llms-full",
    {
      title: "Full documentation",
      description: "Scope, methodology, and federal/state tax tables (markdown).",
      mimeType: "text/markdown",
    },
    (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: getLlmsFull(llmsTxt) }] }),
  );

  server.registerResource(
    "glossary",
    "taxviz://glossary",
    { title: "Tax glossary", description: "Definitions of terms used by the model (markdown).", mimeType: "text/markdown" },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: `# Glossary\n\n${GLOSSARY.map((g) => `- **${g.term}**: ${g.definition}`).join("\n")}\n`,
        },
      ],
    }),
  );

  return server;
}
