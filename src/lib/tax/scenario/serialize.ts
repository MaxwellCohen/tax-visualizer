import { isStateCode } from "~/lib/config/states/index";
import type { FilingStatus } from "~/lib/tax/data/types";
import type { TaxFormData, TaxFormRow, TaxFormSettingId } from "~/lib/tax/form/types";
import { SCENARIO_PRESETS } from "~/lib/tax/scenario/presets.constants";
import type { ScenarioPreset } from "~/lib/tax/scenario/types";
import { SCENARIO_QUERY_PARAM } from "./keys.constants";

const FILING_STATUSES = new Set<FilingStatus>([
  "single",
  "marriedJoint",
  "marriedSeparate",
  "headOfHousehold",
]);

const SETTING_IDS = new Set<TaxFormSettingId>([
  "taxYear",
  "filingStatus",
  "residenceState",
  "qualifyingChildren",
  "otherDependents",
  "useItemizedDeductions",
]);

const LINE_TYPES = new Set(["income", "pretax", "deduction", "credit"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSettingRow(row: Record<string, unknown>): TaxFormRow | null {
  if (row.type !== "setting" || typeof row.id !== "string" || !SETTING_IDS.has(row.id as TaxFormSettingId)) {
    return null;
  }
  switch (row.id) {
    case "taxYear":
      return typeof row.value === "number" && Number.isFinite(row.value)
        ? { type: "setting", id: "taxYear", value: row.value }
        : null;
    case "filingStatus":
      return typeof row.value === "string" && FILING_STATUSES.has(row.value as FilingStatus)
        ? { type: "setting", id: "filingStatus", value: row.value as FilingStatus }
        : null;
    case "residenceState":
      return row.value === "none" || isStateCode(row.value)
        ? { type: "setting", id: "residenceState", value: row.value }
        : null;
    case "qualifyingChildren":
    case "otherDependents":
      return typeof row.value === "number" && Number.isFinite(row.value)
        ? { type: "setting", id: row.id, value: row.value }
        : null;
    case "useItemizedDeductions":
      return typeof row.value === "boolean"
        ? { type: "setting", id: "useItemizedDeductions", value: row.value }
        : null;
    default:
      return null;
  }
}

function parseLineRow(row: Record<string, unknown>): TaxFormRow | null {
  if (typeof row.type !== "string" || !LINE_TYPES.has(row.type)) return null;
  if (typeof row.id !== "string" || typeof row.kind !== "string" || typeof row.label !== "string") {
    return null;
  }
  if (typeof row.amount !== "number" || !Number.isFinite(row.amount)) return null;
  return {
    type: row.type as "income" | "pretax" | "deduction" | "credit",
    id: row.id,
    kind: row.kind,
    label: row.label,
    amount: row.amount,
  };
}

export function parseTaxFormRows(data: unknown): TaxFormRow[] | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const rows: TaxFormRow[] = [];
  for (const entry of data) {
    if (!isRecord(entry)) return null;
    const parsed = entry.type === "setting" ? parseSettingRow(entry) : parseLineRow(entry);
    if (!parsed) return null;
    rows.push(parsed);
  }
  return rows;
}

export function parseTaxFormData(data: unknown): TaxFormData | null {
  if (Array.isArray(data)) {
    const rows = parseTaxFormRows(data);
    return rows ? { rows } : null;
  }
  if (!isRecord(data) || !Array.isArray(data.rows)) return null;
  const rows = parseTaxFormRows(data.rows);
  return rows ? { rows } : null;
}

export function serializeScenarioInput(input: TaxFormData): string {
  return JSON.stringify(input.rows);
}

function parseScenarioJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(decodeURIComponent(raw));
  }
}

export function deserializeScenarioInputFromSearchParams(searchParams: Record<string, string>): TaxFormData | null {
  const scenarioData = searchParams[SCENARIO_QUERY_PARAM] || "";
  if (!scenarioData) return null;
  try {
    return parseTaxFormData(parseScenarioJson(scenarioData));
  } catch {
    return null;
  }
}

export function getScenarioPresets(): ScenarioPreset[] {
  return [...SCENARIO_PRESETS];
}
