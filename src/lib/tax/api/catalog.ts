import { getStateYearValues, STATE_NAMES } from "~/lib/config/states/index";
import { STATE_CODES } from "~/lib/config/states/types";
import { getAvailableTaxYears, getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import { READABLE_SETTING_PARAMS } from "~/lib/tax/scenario/readableParams";
import {
  FILING_STATUSES,
  getLineItemDefinitions,
  type LineItemDefinition,
} from "~/lib/tax/scenario/scenarioInput";

/** Supported years, filing statuses, states, and accepted line-item ids (`GET /api/years`). */
export function getApiCatalog() {
  const years = getAvailableTaxYears();
  const latest = getTaxYearConfig(years[0] ?? 2026);
  const singleIds = new Set(
    latest ? getLineItemDefinitions(latest, "single").map((d) => d.id) : [],
  );
  const lineItems: (LineItemDefinition & { marriedJointOnly: boolean })[] = latest
    ? getLineItemDefinitions(latest, "marriedJoint").map((d) => ({
        ...d,
        marriedJointOnly: !singleIds.has(d.id),
      }))
    : [];
  return {
    years: years.map((year) => ({ year, status: getTaxYearConfig(year)?.status ?? "final" })),
    filingStatuses: FILING_STATUSES,
    states: [
      { code: "none", name: "No state income tax modeled" },
      ...STATE_CODES.map((code) => ({ code, name: STATE_NAMES[code] })),
    ],
    lineItems,
    shareUrlParams: READABLE_SETTING_PARAMS,
  };
}

/** Federal year values (`GET /api/config/:year`), or null if the year is unsupported. */
export function getFederalYearConfig(year: number) {
  const config = getTaxYearConfig(year);
  return config ? { year, ...config } : null;
}

/** State year values (`GET /api/states/:year`); `null` entries have no broad-based income tax. */
export function getStateYearConfig(year: number) {
  const values = getStateYearValues(year);
  if (!values) return null;
  return {
    year,
    states: Object.fromEntries(
      STATE_CODES.map((code) => [code, { name: STATE_NAMES[code], rules: values[code] }]),
    ),
  };
}
