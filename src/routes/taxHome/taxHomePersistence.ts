import { createEffect, createSignal, onMount } from "solid-js";
import type { Accessor, Setter } from "solid-js";
import type { TaxFormData } from "~/lib/taxForm.types";
import { getAvailableTaxYears } from "~/lib/taxData";
import {
  BASELINE_SCENARIO_STORAGE_KEY,
  SAVED_SCENARIO_STORAGE_KEY,
  SCENARIO_QUERY_PARAM,
  deserializeScenarioInput,
  serializeScenarioInput,
} from "~/lib/taxScenario";

/** Max total URL length before dropping the scenario query param (browser/practical limits). */
export const MAX_SCENARIO_URL_LENGTH = 10_000;

/** Tracks the last `scenario` query value after we sync the address bar (for tooling / consistency). */
const SESSION_LAST_URL_SCENARIO_Q = "taxvizLastUrlScenarioQ";

function writeSessionLastUrlScenario(encodedParam: string | null): void {
  try {
    window.sessionStorage.setItem(SESSION_LAST_URL_SCENARIO_Q, encodedParam ?? "");
  } catch {
    /* private mode */
  }
}

function syncSessionStorageWithAddressBar(): void {
  if (typeof window === "undefined") return;
  const v = new URL(window.location.href).searchParams.get(SCENARIO_QUERY_PARAM);
  writeSessionLastUrlScenario(v);
}

type PersistenceArgs = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  setBaselineInput: Setter<TaxFormData | null>;
};

/**
 * Builds a full URL string with the serialized scenario, mirroring address-bar update rules.
 * Use for share links so the clipboard matches what `applyScenarioToUrl` would set.
 */
export function buildUrlWithScenario(baseHref: string, input: TaxFormData): string {
  const encoded = serializeScenarioInput(input);
  const url = new URL(baseHref);
  url.searchParams.set(SCENARIO_QUERY_PARAM, encoded);
  if (url.toString().length > MAX_SCENARIO_URL_LENGTH) {
    url.searchParams.delete(SCENARIO_QUERY_PARAM);
  }
  return url.toString();
}

export function applyScenarioToUrl(input: TaxFormData): void {
  if (typeof window === "undefined") return;
  const next = buildUrlWithScenario(window.location.href, input);
  window.history.replaceState({}, "", next);
  syncSessionStorageWithAddressBar();
}

export function wireTaxHomePersistence(args: PersistenceArgs): {
  syncScenarioToUrl: () => void;
} {
  const [storageReady, setStorageReady] = createSignal(false);
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? new Date().getFullYear();

  onMount(() => {
    const url = new URL(window.location.href);
    const sharedScenario = url.searchParams.get(SCENARIO_QUERY_PARAM);
    const hasScenarioQuery = sharedScenario != null && sharedScenario.length > 0;

    const urlInput = hasScenarioQuery
      ? deserializeScenarioInput(sharedScenario, availableYears, defaultYear)
      : null;

    let savedInput: ReturnType<typeof deserializeScenarioInput> = null;
    let savedBaseline: ReturnType<typeof deserializeScenarioInput> = null;

    try {
      const storedScenario = window.localStorage.getItem(SAVED_SCENARIO_STORAGE_KEY);
      if (storedScenario) {
        savedInput = deserializeScenarioInput(storedScenario, availableYears, defaultYear);
      }
      const storedBaseline = window.localStorage.getItem(BASELINE_SCENARIO_STORAGE_KEY);
      savedBaseline = storedBaseline
        ? deserializeScenarioInput(storedBaseline, availableYears, defaultYear)
        : null;
    } catch (e) {
      console.warn("Failed to read scenarios from localStorage:", e);
    }

    // URL is authoritative when ?scenario= is present; otherwise use localStorage, else keep starter.
    if (hasScenarioQuery) {
      if (urlInput) {
        args.setTaxInput(urlInput);
        writeSessionLastUrlScenario(sharedScenario);
      } else if (savedInput) {
        args.setTaxInput(savedInput);
      }
    } else if (savedInput) {
      args.setTaxInput(savedInput);
      writeSessionLastUrlScenario(null);
    }

    if (savedBaseline) {
      args.setBaselineInput(savedBaseline);
    }

    setStorageReady(true);
  });

  createEffect(() => {
    if (!storageReady() || typeof window === "undefined") return;
    const input = args.taxInput();
    const encoded = serializeScenarioInput(input);

    // Always save to localStorage (primary persistence)
    try {
      window.localStorage.setItem(SAVED_SCENARIO_STORAGE_KEY, encoded);
    } catch (e) {
      console.warn("Failed to save scenario to localStorage:", e);
    }
  });

  return {
    syncScenarioToUrl: () => {
      if (!storageReady() || typeof window === "undefined") return;
      applyScenarioToUrl(args.taxInput());
    },
  };
}
