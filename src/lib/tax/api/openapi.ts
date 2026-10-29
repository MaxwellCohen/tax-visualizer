import { STATE_CODES } from "~/lib/config/states/types";
import { getAvailableTaxYears } from "~/lib/tax/data/accessors.impl";
import { SITE_NAME } from "~/lib/site/meta";
import { FILING_STATUSES, LINE_ITEM_ALIASES } from "~/lib/tax/scenario/scenarioInput";

const money = { type: "number", description: "Annual USD" } as const;
const rate = { type: "number", description: "Fraction (0.22 = 22%)" } as const;
const jsonContent = (schema: object) => ({ "application/json": { schema } });
const errorResponse = (description: string) => ({
  description,
  content: jsonContent({ $ref: "#/components/schemas/Error" }),
});
const yearParam = {
  name: "year",
  in: "path",
  required: true,
  schema: { type: "integer", enum: getAvailableTaxYears() },
} as const;

/** Hand-written OpenAPI 3.1 document served at `/openapi.json`. */
export function getOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: `${SITE_NAME} API`,
      version: "1.0.0",
      description:
        "Educational US federal + state income tax and payroll tax estimates. Not tax advice. " +
        "All amounts are annual USD. See /llms.txt for modeling scope.",
    },
    servers: [{ url: "/" }],
    paths: {
      "/api/calculate": {
        post: {
          operationId: "calculateScenario",
          summary: "Calculate taxes and take-home pay for a scenario",
          requestBody: {
            required: true,
            content: jsonContent({ $ref: "#/components/schemas/ScenarioInput" }),
          },
          responses: {
            200: {
              description: "Scenario summary",
              content: jsonContent({ $ref: "#/components/schemas/ScenarioSummary" }),
            },
            400: errorResponse("Invalid JSON or invalid scenario; `errors` lists valid values"),
          },
        },
      },
      "/api/years": {
        get: {
          operationId: "getCatalog",
          summary: "Supported tax years, filing statuses, states, and accepted line-item ids",
          responses: { 200: { description: "Catalog", content: jsonContent({ type: "object" }) } },
        },
      },
      "/api/config/{year}": {
        get: {
          operationId: "getFederalConfig",
          summary: "Federal tax year values (brackets, standard deduction, payroll, limits)",
          parameters: [yearParam],
          responses: {
            200: { description: "Federal year config", content: jsonContent({ type: "object" }) },
            404: errorResponse("Unsupported year"),
          },
        },
      },
      "/api/states/{year}": {
        get: {
          operationId: "getStateConfig",
          summary: "State income tax rules for all 50 states + DC",
          description:
            "Brackets are `[over, rate]` rows. Amount pairs are `[single, marriedJoint]`. `rules: null` = no broad-based income tax.",
          parameters: [yearParam],
          responses: {
            200: { description: "State year values", content: jsonContent({ type: "object" }) },
            404: errorResponse("Unsupported year"),
          },
        },
      },
    },
    components: {
      schemas: {
        ScenarioInput: {
          type: "object",
          required: ["year"],
          additionalProperties: false,
          properties: {
            year: { type: "integer", enum: getAvailableTaxYears() },
            filingStatus: { type: "string", enum: FILING_STATUSES, default: "single" },
            state: {
              type: "string",
              enum: ["none", ...STATE_CODES],
              default: "none",
              description: "Two-letter residence state (case-insensitive) or `none`",
            },
            qualifyingChildren: { type: "integer", minimum: 0, default: 0 },
            otherDependents: { type: "integer", minimum: 0, default: 0 },
            itemize: { type: "boolean", default: false, description: "Use itemized deductions instead of standard" },
            lineItems: {
              type: "object",
              description:
                "Map of line-item id or alias → annual USD amount. See GET /api/years for all ids.",
              propertyNames: { type: "string" },
              additionalProperties: { type: "number", minimum: 0 },
              examples: [{ wages: 90000, "401k": 10000 }],
              "x-aliases": LINE_ITEM_ALIASES,
            },
          },
          examples: [{ year: 2026, filingStatus: "single", state: "CA", lineItems: { wages: 90000 } }],
        },
        ScenarioSummary: {
          type: "object",
          properties: {
            input: { $ref: "#/components/schemas/ScenarioInput" },
            grossIncome: money,
            preTaxDeductions: money,
            adjustedGrossIncome: money,
            deduction: {
              type: "object",
              properties: { type: { type: "string", enum: ["standard", "itemized"] }, amount: money },
            },
            taxableIncome: money,
            federalIncomeTax: money,
            federalCreditsApplied: money,
            stateIncomeTax: money,
            stateTaxableIncome: money,
            payrollTaxes: {
              type: "object",
              properties: { socialSecurity: money, medicare: money, selfEmployment: money, total: money },
            },
            totalTax: money,
            takeHomePay: money,
            rates: {
              type: "object",
              properties: {
                effectiveIncomeTaxRate: rate,
                effectiveTotalTaxRate: rate,
                federalMarginalRate: rate,
                stateMarginalRate: rate,
              },
            },
            shareUrl: { type: "string", description: "Relative app URL reproducing the scenario" },
            warnings: { type: "array", items: { type: "string" } },
          },
        },
        Error: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
            errors: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  };
}
