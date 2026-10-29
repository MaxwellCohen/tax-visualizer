import { isStateCode } from "~/lib/config/states/index";
import { STATE_CODES } from "~/lib/config/states/types";
import { getAllowedLineItemKindSets } from "~/lib/config/taxPage/allowedInputKinds";
import {
  buildValidationContext,
  getInputItems,
  validateLineItemAmount,
} from "~/lib/config/taxPage/taxPage.config";
import type { InputCategory } from "~/lib/config/taxPage/types";
import { getAvailableTaxYears, getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import { taxFormDataFromParts } from "~/lib/tax/form/factories";
import type {
  ResidenceState,
  TaxFormCreditRow,
  TaxFormData,
  TaxFormDeductionRow,
  TaxFormIncomeRow,
  TaxFormPretaxRow,
} from "~/lib/tax/form/types";

export const FILING_STATUSES: readonly FilingStatus[] = [
  "single",
  "marriedJoint",
  "marriedSeparate",
  "headOfHousehold",
];

/**
 * Short, human-readable aliases for common line-item kinds (registry `subcategories[].key`).
 * Accepted in share URLs and the API alongside the full kind ids.
 */
export const LINE_ITEM_ALIASES: Readonly<Record<string, string>> = {
  wages: "income-ordinary-wages-spouse1",
  wages2: "income-ordinary-wages-spouse2",
  se: "income-ordinary-selfEmployment-selfEmployment-spouse1",
  se2: "income-ordinary-selfEmployment-selfEmployment-spouse2",
  stcg: "income-ordinary-shortTermCapGains-shortTermCapGains-spouse1",
  stcg2: "income-ordinary-shortTermCapGains-shortTermCapGains-spouse2",
  ltcg: "income-longTermCapGains-longTermCapGains-spouse1",
  ltcg2: "income-longTermCapGains-longTermCapGains-spouse2",
  otherIncome: "income-ordinary-other-other-spouse1",
  otherIncome2: "income-ordinary-other-other-spouse2",
  "401k": "input-pretax-401K-preTax401kSpouse1",
  "401k2": "input-pretax-401K-preTax401kSpouse2",
  "403b": "input-pretax-401K-preTax403bSpouse1",
  "403b2": "input-pretax-401K-preTax403bSpouse2",
  "457b": "input-pretax-401K-preTax457bSpouse1",
  "457b2": "input-pretax-401K-preTax457bSpouse2",
  catchUp: "input-pretax-401K-electiveCatchUpSpouse1",
  catchUp2: "input-pretax-401K-electiveCatchUpSpouse2",
  hsa: "input-pretax-hsa-preTaxHsaSpouse1",
  hsa2: "input-pretax-hsa-preTaxHsaSpouse2",
  ira: "input-pretax-traditionalIra-traditionalIraSpouse1",
  ira2: "input-pretax-traditionalIra-traditionalIraSpouse2",
  otherPretax: "input-pretax-otherPretax-preTaxOther",
  healthFsa: "input-pretax-otherPretax-preTaxHealthFsaSpouse1",
  healthFsa2: "input-pretax-otherPretax-preTaxHealthFsaSpouse2",
  dependentCareFsa: "input-pretax-otherPretax-preTaxDependentCareFsaSpouse1",
  dependentCareFsa2: "input-pretax-otherPretax-preTaxDependentCareFsaSpouse2",
  commuter: "input-pretax-otherPretax-preTaxCommuterSpouse1",
  commuter2: "input-pretax-otherPretax-preTaxCommuterSpouse2",
  salt: "deduction-salt-salt",
  medical: "deduction-medicalDental-medicalDental",
  mortgage: "deduction-mortgageInterest-mortgageInterest",
  charity: "deduction-charitable-charitable",
  educationCredit: "input-credit-education-education",
  saversCredit: "retirementSavingsContributions-retirementSavingsContributions",
  otherCredit: "input-credit-other-otherFederalCredit",
  childCareCredit: "input-credit-other-childAndDependentCare",
  foreignTaxCredit: "input-credit-other-foreignTaxCredit",
  cleanEnergyCredit: "input-credit-other-residentialCleanEnergy",
  evCredit: "input-credit-other-electricVehicleCredit",
  businessCredit: "input-credit-other-generalBusinessCredit",
};

const KIND_TO_ALIAS: ReadonlyMap<string, string> = new Map(
  Object.entries(LINE_ITEM_ALIASES).map(([alias, kind]) => [kind, alias]),
);

/** Validated scenario for the API and readable share links. Amounts are annual USD. */
export type ScenarioInput = {
  year: number;
  filingStatus: FilingStatus;
  state: ResidenceState;
  qualifyingChildren: number;
  otherDependents: number;
  itemize: boolean;
  /** Keyed by full kind id (aliases are resolved during validation). */
  lineItems: Record<string, number>;
};

export type LineItemDefinition = {
  id: string;
  alias?: string;
  category: InputCategory;
  label: string;
  description?: string;
};

export type ScenarioInputResult =
  | { ok: true; value: ScenarioInput }
  | { ok: false; errors: string[] };

/** Every accepted line-item kind for a year and filing status, in registry order. */
export function getLineItemDefinitions(
  taxData: TaxYearConfig,
  filingStatus: FilingStatus,
): LineItemDefinition[] {
  const allowed = getAllowedLineItemKindSets(taxData, filingStatus);
  const joint = filingStatus === "marriedJoint";
  const out: LineItemDefinition[] = [];
  for (const item of getInputItems(taxData, filingStatus)) {
    const category = item.input?.category;
    if (!category) continue;
    for (const sub of item.input?.subcategories ?? []) {
      if (!allowed[category].has(sub.key)) continue;
      out.push({
        id: sub.key,
        alias: KIND_TO_ALIAS.get(sub.key),
        category,
        label: joint ? sub.labelJoint : sub.labelSingle,
        description: item.description,
      });
    }
  }
  return out;
}

/** Resolve an alias or full kind id to the kind id; returns the input unchanged if it is not an alias. */
export function resolveLineItemKind(idOrAlias: string): string {
  return LINE_ITEM_ALIASES[idOrAlias] ?? idOrAlias;
}

export function lineItemAlias(kind: string): string | undefined {
  return KIND_TO_ALIAS.get(kind);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeInteger(value: unknown, field: string, errors: string[]): number {
  if (value === undefined) return 0;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    errors.push(`${field} must be a non-negative integer.`);
    return 0;
  }
  return value;
}

/**
 * Validate an untrusted scenario (API body or parsed URL params). Errors list the valid
 * years, filing statuses, states, or line-item ids so callers can self-correct.
 */
export function validateScenarioInput(raw: unknown): ScenarioInputResult {
  if (!isRecord(raw)) return { ok: false, errors: ["Body must be a JSON object."] };
  const errors: string[] = [];
  const years = getAvailableTaxYears();

  const year = raw.year;
  const taxData = typeof year === "number" ? getTaxYearConfig(year) : null;
  if (!taxData) errors.push(`year must be one of ${years.join(", ")}.`);

  const filingStatus = raw.filingStatus ?? "single";
  if (typeof filingStatus !== "string" || !FILING_STATUSES.includes(filingStatus as FilingStatus)) {
    errors.push(`filingStatus must be one of ${FILING_STATUSES.join(", ")}.`);
  }

  const rawState = raw.state ?? "none";
  const state = typeof rawState === "string" ? rawState.toUpperCase() : rawState;
  if (state !== "NONE" && !isStateCode(state)) {
    errors.push(`state must be "none" or a two-letter code: ${STATE_CODES.join(", ")}.`);
  }

  const qualifyingChildren = nonNegativeInteger(raw.qualifyingChildren, "qualifyingChildren", errors);
  const otherDependents = nonNegativeInteger(raw.otherDependents, "otherDependents", errors);

  const itemize = raw.itemize ?? false;
  if (typeof itemize !== "boolean") errors.push("itemize must be a boolean.");

  const rawItems = raw.lineItems ?? {};
  if (!isRecord(rawItems)) {
    errors.push('lineItems must be an object of { "<id or alias>": annualAmountUsd }.');
  }

  if (errors.length > 0 || !taxData) return { ok: false, errors };

  const status = filingStatus as FilingStatus;
  const definitions = getLineItemDefinitions(taxData, status);
  const knownKinds = new Set(definitions.map((d) => d.id));
  const ctx = buildValidationContext(year as number, status);
  const lineItems: Record<string, number> = {};
  const unknown: string[] = [];

  for (const [key, amount] of Object.entries(rawItems as Record<string, unknown>)) {
    const kind = resolveLineItemKind(key);
    if (!knownKinds.has(kind)) {
      unknown.push(key);
      continue;
    }
    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      errors.push(`lineItems.${key} must be a finite number (annual USD).`);
      continue;
    }
    const total = (lineItems[kind] ?? 0) + amount;
    const message = validateLineItemAmount(kind, total, ctx, taxData);
    if (message) errors.push(`lineItems.${key}: ${message}.`);
    else lineItems[kind] = total;
  }

  if (unknown.length > 0) {
    const valid = definitions.map((d) => (d.alias ? `${d.alias} (${d.id})` : d.id));
    errors.push(
      `Unknown line item id(s) for ${status}: ${unknown.join(", ")}. Valid ids: ${valid.join(", ")}.`,
    );
  }
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      year: year as number,
      filingStatus: status,
      state: state === "NONE" ? "none" : (state as ResidenceState),
      qualifyingChildren,
      otherDependents,
      itemize: itemize as boolean,
      lineItems,
    },
  };
}

/** Build form rows with deterministic ids (`q-<alias or kind>`) so withholding job links stay stable. */
export function scenarioInputToTaxFormData(input: ScenarioInput): TaxFormData {
  const taxData = getTaxYearConfig(input.year);
  const categoryByKind = new Map(
    taxData
      ? getLineItemDefinitions(taxData, input.filingStatus).map((d) => [d.id, d.category])
      : [],
  );
  const incomeRows: TaxFormIncomeRow[] = [];
  const pretaxRows: TaxFormPretaxRow[] = [];
  const deductionRows: TaxFormDeductionRow[] = [];
  const creditRows: TaxFormCreditRow[] = [];
  for (const [kind, amount] of Object.entries(input.lineItems)) {
    const base = { id: `q-${lineItemAlias(kind) ?? kind}`, kind, label: "", amount };
    switch (categoryByKind.get(kind)) {
      case "income":
        incomeRows.push({ type: "income", ...base });
        break;
      case "pretax":
        pretaxRows.push({ type: "pretax", ...base });
        break;
      case "deduction":
        deductionRows.push({ type: "deduction", ...base });
        break;
      case "credit":
        creditRows.push({ type: "credit", ...base });
        break;
    }
  }
  return taxFormDataFromParts({
    taxYear: input.year,
    filingStatus: input.filingStatus,
    residenceState: input.state,
    qualifyingChildren: input.qualifyingChildren,
    otherDependents: input.otherDependents,
    incomeRows,
    pretaxRows,
    useItemizedDeductions: input.itemize,
    deductionRows,
    creditRows,
  });
}
