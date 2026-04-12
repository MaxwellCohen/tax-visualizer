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

type PersistenceArgs = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  setBaselineInput: Setter<TaxFormData | null>;
};

export function wireTaxHomePersistence(args: PersistenceArgs): void {
  const [storageReady, setStorageReady] = createSignal(false);
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? new Date().getFullYear();

  onMount(() => {
    const url = new URL(window.location.href);
    const sharedScenario = url.searchParams.get(SCENARIO_QUERY_PARAM);
    const urlInput = sharedScenario
      ? deserializeScenarioInput(sharedScenario, availableYears, defaultYear)
      : null;
    let savedInput: ReturnType<typeof deserializeScenarioInput> = null;
    let savedBaseline: ReturnType<typeof deserializeScenarioInput> = null;

    try {
      const storedScenario = window.localStorage.getItem(SAVED_SCENARIO_STORAGE_KEY);
      savedInput = storedScenario
        ? deserializeScenarioInput(storedScenario, availableYears, defaultYear)
        : null;
      const storedBaseline = window.localStorage.getItem(BASELINE_SCENARIO_STORAGE_KEY);
      savedBaseline = storedBaseline
        ? deserializeScenarioInput(storedBaseline, availableYears, defaultYear)
        : null;
    } catch (e) {
      console.warn("Failed to read scenarios from localStorage:", e);
    }

    if (urlInput) {
      args.setTaxInput(urlInput);
    } else if (savedInput) {
      args.setTaxInput(savedInput);
    }

    if (savedBaseline) {
      args.setBaselineInput(savedBaseline);
    }

    setStorageReady(true);
  });

  createEffect(() => {
    if (!storageReady() || typeof window === "undefined") return;
    const encoded = serializeScenarioInput(args.taxInput());
    const url = new URL(window.location.href);
    url.searchParams.set(SCENARIO_QUERY_PARAM, encoded);
    if (url.toString().length > 2000) {
      console.warn("URL exceeds 2000 characters, truncating scenario data");
      return;
    }
    window.history.replaceState({}, "", url);
    try {
      window.localStorage.setItem(SAVED_SCENARIO_STORAGE_KEY, encoded);
    } catch (e) {
      console.warn("Failed to save scenario to localStorage:", e);
    }
  });
}
