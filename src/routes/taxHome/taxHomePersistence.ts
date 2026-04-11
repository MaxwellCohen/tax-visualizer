import { createEffect, onMount } from "solid-js";
import type { Accessor, Setter } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import {
  BASELINE_SCENARIO_STORAGE_KEY,
  SAVED_SCENARIO_STORAGE_KEY,
  SCENARIO_QUERY_PARAM,
  deserializeScenarioInput,
  serializeScenarioInput,
} from "~/lib/taxScenario";

type PersistenceArgs = {
  storageReady: Accessor<boolean>;
  setStorageReady: Setter<boolean>;
  taxInput: Accessor<TaxInput>;
  setTaxInput: Setter<TaxInput>;
  setBaselineInput: Setter<TaxInput | null>;
  availableYears: number[];
  defaultYear: number;
};

export function wireTaxHomePersistence(args: PersistenceArgs): void {
  onMount(() => {
    const url = new URL(window.location.href);
    const sharedScenario = url.searchParams.get(SCENARIO_QUERY_PARAM);
    const urlInput = sharedScenario
      ? deserializeScenarioInput(sharedScenario, args.availableYears, args.defaultYear)
      : null;
    const storedScenario = window.localStorage.getItem(SAVED_SCENARIO_STORAGE_KEY);
    const savedInput = storedScenario
      ? deserializeScenarioInput(storedScenario, args.availableYears, args.defaultYear)
      : null;
    const storedBaseline = window.localStorage.getItem(BASELINE_SCENARIO_STORAGE_KEY);
    const savedBaseline = storedBaseline
      ? deserializeScenarioInput(storedBaseline, args.availableYears, args.defaultYear)
      : null;

    if (urlInput) {
      args.setTaxInput(urlInput);
    } else if (savedInput) {
      args.setTaxInput(savedInput);
    }

    if (savedBaseline) {
      args.setBaselineInput(savedBaseline);
    }

    args.setStorageReady(true);
  });

  createEffect(() => {
    if (!args.storageReady() || typeof window === "undefined") return;
    const encoded = serializeScenarioInput(args.taxInput());
    const url = new URL(window.location.href);
    url.searchParams.set(SCENARIO_QUERY_PARAM, encoded);
    window.history.replaceState({}, "", url);
    window.localStorage.setItem(SAVED_SCENARIO_STORAGE_KEY, encoded);
  });
}
