import { clampTaxFormData } from "~/lib/taxCalc.clamp";
import { getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { TaxFormData } from "~/lib/taxForm.types";
import { pruneDisallowedLineItemKinds } from "~/lib/taxScenario.pruneLineItemKinds";
import {
  fallbackScenario,
  normalizeTaxYear,
  sanitizeFilingStatus,
  sanitizeMoney,
} from "~/lib/taxScenario.sanitizeHelpers";

function sanitizeSettingRow(raw: Record<string, unknown>): TaxFormRow | null {
  const id = raw.id;
  if (id === "taxYear") {
    const v = Number(raw.value);
    return { type: "setting", id: "taxYear", value: Number.isFinite(v) ? v : new Date().getFullYear() };
  }
  if (id === "filingStatus") {
    return { type: "setting", id: "filingStatus", value: sanitizeFilingStatus(raw.value) };
  }
  if (id === "useItemizedDeductions") {
    return { type: "setting", id: "useItemizedDeductions", value: Boolean(raw.value) };
  }
  return null;
}

function sanitizeOneRow(raw: unknown, index: number): TaxFormRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const t = o.type;
  if (t === "setting") {
    return sanitizeSettingRow(o);
  }
  if (t === "income") {
    return {
      type: "income",
      id: typeof o.id === "string" && o.id.trim() ? o.id : `inc-${index}`,
      kind: o.kind as string,
      label: typeof o.label === "string" ? o.label : "",
      amount: sanitizeMoney(o.amount),
    };
  }
  if (t === "pretax") {
    return {
      type: "pretax",
      id: typeof o.id === "string" && o.id.trim() ? o.id : `ptx-${index}`,
      kind: o.kind as string,
      label: typeof o.label === "string" ? o.label : "",
      amount: sanitizeMoney(o.amount),
    };
  }
  if (t === "deduction") {
    return {
      type: "deduction",
      id: typeof o.id === "string" && o.id.trim() ? o.id : `itm-${index}`,
      kind: o.kind as string,
      label: typeof o.label === "string" ? o.label : "",
      amount: sanitizeMoney(o.amount),
    };
  }
  if (t === "credit") {
    return {
      type: "credit",
      id: typeof o.id === "string" && o.id.trim() ? o.id : `crd-${index}`,
      kind: o.kind as string,
      label: typeof o.label === "string" ? o.label : "",
      amount: sanitizeMoney(o.amount),
    };
  }
  return null;
}

function sanitizeRowsList(raw: unknown, availableYears: number[], fallbackYear: number): TaxFormRow[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallbackScenario(fallbackYear).rows;
  }
  const out: TaxFormRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = sanitizeOneRow(raw[i], i);
    if (row) {
      out.push(row);
    }
  }
  if (out.length === 0) {
    return fallbackScenario(fallbackYear).rows;
  }
  const ty = normalizeTaxYear(getTaxYearFromRows(out), availableYears, fallbackYear);
  const rowsWithYear = out.map((r) =>
    r.type === "setting" && r.id === "taxYear" ? { ...r, value: ty } : r,
  );
  return pruneDisallowedLineItemKinds(rowsWithYear);
}

export function sanitizeScenarioInput(
  rawValue: unknown,
  availableYears: number[],
  fallbackYear: number,
): TaxFormData {
  if (rawValue == null || typeof rawValue !== "object") {
    return fallbackScenario(fallbackYear);
  }

  // Wire format from serializeScenarioInput / URLs: JSON array of rows only.
  if (Array.isArray(rawValue)) {
    const rows = sanitizeRowsList(rawValue, availableYears, fallbackYear);
    return clampTaxFormData({ rows });
  }

  const raw = rawValue as { version?: unknown; rows?: unknown };
  if (raw.version !== 5 || raw.rows === undefined) {
    return fallbackScenario(normalizeTaxYear(undefined, availableYears, fallbackYear));
  }

  const rows = sanitizeRowsList(raw.rows, availableYears, fallbackYear);
  return clampTaxFormData({ rows });
}
