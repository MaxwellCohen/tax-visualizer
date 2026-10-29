import { isStateCode } from "~/lib/config/states/index";
import { getAvailableTaxYears, getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { FilingStatus } from "~/lib/tax/data/types";
import type { TaxFormData } from "~/lib/tax/form/types";
import {
  FILING_STATUSES,
  getLineItemDefinitions,
  lineItemAlias,
  resolveLineItemKind,
  scenarioInputToTaxFormData,
  type ScenarioInput,
} from "~/lib/tax/scenario/scenarioInput";

/**
 * Human-readable scenario query params (read on load when `scenario` is absent):
 * `?year=2026&filingStatus=single&state=CA&wages=90000&401k=10000`.
 * Line items accept an alias from `LINE_ITEM_ALIASES` or a full registry kind id.
 */
export const READABLE_SETTING_PARAMS = {
  year: "year",
  filingStatus: "filingStatus",
  state: "state",
  qualifyingChildren: "children",
  otherDependents: "otherDependents",
  itemize: "itemize",
} as const;

const SETTING_PARAM_SET = new Set<string>(Object.values(READABLE_SETTING_PARAMS));

function lineItemKinds(year: number, filingStatus: FilingStatus): Set<string> {
  const taxData = getTaxYearConfig(year);
  return new Set(taxData ? getLineItemDefinitions(taxData, filingStatus).map((d) => d.id) : []);
}

function allLineItemKinds(): Set<string> {
  return lineItemKinds(getAvailableTaxYears()[0] ?? 2026, "marriedJoint");
}

function isReadableParam(key: string, kinds: Set<string>): boolean {
  return SETTING_PARAM_SET.has(key) || kinds.has(resolveLineItemKind(key));
}

export function hasReadableScenarioParams(params: Record<string, string>): boolean {
  const kinds = allLineItemKinds();
  return Object.keys(params).some((key) => isReadableParam(key, kinds));
}

/** `undefined` for every readable param present, so a router merge drops them. */
export function clearedReadableScenarioParams(params: Record<string, unknown>): Record<string, undefined> {
  const kinds = allLineItemKinds();
  return Object.fromEntries(
    Object.keys(params)
      .filter((key) => isReadableParam(key, kinds))
      .map((key) => [key, undefined]),
  );
}

/** Accepts `90000`, `90,000`, `90_000`, `$90000`; returns null for anything else. */
export function parseReadableAmount(raw: string | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.trim().replace(/^\$/, "").replace(/[,_]/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function parseCount(raw: string | undefined): number {
  const value = Number(raw);
  return raw != null && Number.isInteger(value) && value >= 0 ? value : 0;
}

/**
 * Lenient URL parser: invalid settings fall back to defaults and invalid or unknown line items
 * are skipped (the form clamps over-limit amounts after load). Returns null when no readable
 * params are present.
 */
export function parseReadableScenarioParams(
  params: Record<string, string>,
  defaultYear: number,
): ScenarioInput | null {
  if (!hasReadableScenarioParams(params)) return null;
  const yearParam = Number(params[READABLE_SETTING_PARAMS.year]);
  const year = getTaxYearConfig(yearParam) ? yearParam : defaultYear;
  const statusParam = params[READABLE_SETTING_PARAMS.filingStatus] as FilingStatus;
  const filingStatus = FILING_STATUSES.includes(statusParam) ? statusParam : "single";
  const stateParam = params[READABLE_SETTING_PARAMS.state]?.toUpperCase();
  const itemizeParam = params[READABLE_SETTING_PARAMS.itemize]?.toLowerCase();

  const kinds = lineItemKinds(year, filingStatus);
  const lineItems: Record<string, number> = {};
  for (const [key, raw] of Object.entries(params)) {
    if (SETTING_PARAM_SET.has(key)) continue;
    const kind = resolveLineItemKind(key);
    const amount = parseReadableAmount(raw);
    if (!kinds.has(kind) || amount === null) continue;
    lineItems[kind] = (lineItems[kind] ?? 0) + amount;
  }

  return {
    year,
    filingStatus,
    state: isStateCode(stateParam) ? stateParam : "none",
    qualifyingChildren: parseCount(params[READABLE_SETTING_PARAMS.qualifyingChildren]),
    otherDependents: parseCount(params[READABLE_SETTING_PARAMS.otherDependents]),
    itemize: itemizeParam === "1" || itemizeParam === "true" || itemizeParam === "yes",
    lineItems,
  };
}

export function scenarioFromReadableParams(
  params: Record<string, string>,
  defaultYear: number,
): TaxFormData | null {
  const input = parseReadableScenarioParams(params, defaultYear);
  return input ? scenarioInputToTaxFormData(input) : null;
}

/** Inverse of {@link parseReadableScenarioParams}; uses aliases where one exists and omits defaults. */
export function scenarioInputToSearchParams(input: ScenarioInput): URLSearchParams {
  const out = new URLSearchParams();
  out.set(READABLE_SETTING_PARAMS.year, String(input.year));
  out.set(READABLE_SETTING_PARAMS.filingStatus, input.filingStatus);
  if (input.state !== "none") out.set(READABLE_SETTING_PARAMS.state, input.state);
  if (input.qualifyingChildren > 0) {
    out.set(READABLE_SETTING_PARAMS.qualifyingChildren, String(input.qualifyingChildren));
  }
  if (input.otherDependents > 0) {
    out.set(READABLE_SETTING_PARAMS.otherDependents, String(input.otherDependents));
  }
  if (input.itemize) out.set(READABLE_SETTING_PARAMS.itemize, "1");
  for (const [kind, amount] of Object.entries(input.lineItems)) {
    if (amount !== 0) out.set(lineItemAlias(kind) ?? kind, String(amount));
  }
  return out;
}

export function scenarioShareUrl(input: ScenarioInput, pathname = "/"): string {
  return `${pathname}?${scenarioInputToSearchParams(input).toString()}`;
}
