import type { TaxFormData } from "~/lib/tax/form/types";
import type { WithholdingInputs } from "~/lib/tax/withholding/types";

const SCENARIO_STORAGE_KEY = "tax-visualizer-scenario";
const WITHHOLDING_STORAGE_KEY = "tax-visualizer-withholding";

function canUseStorage(): boolean {
  return typeof localStorage !== "undefined";
}

export function persistScenarioLocally(input: TaxFormData): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(input));
  } catch {
    /* quota or private mode */
  }
}

export function loadScenarioFromLocalStorage(): TaxFormData | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TaxFormData;
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistWithholdingLocally(inputs: WithholdingInputs): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(WITHHOLDING_STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    /* quota or private mode */
  }
}

export function loadWithholdingFromLocalStorage(): WithholdingInputs | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(WITHHOLDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WithholdingInputs;
    if (!parsed || !Array.isArray(parsed.jobs)) return null;
    return parsed;
  } catch {
    return null;
  }
}
