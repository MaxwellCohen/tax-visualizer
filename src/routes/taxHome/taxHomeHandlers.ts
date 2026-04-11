import type { Accessor, Setter } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import type { ScenarioPreset } from "~/lib/taxScenario.types";
import {
  BASELINE_SCENARIO_STORAGE_KEY,
  buildScenarioSummaryText,
  serializeScenarioInput,
} from "~/lib/taxScenario";
import { cloneScenario, starterScenario } from "~/routes/taxHome/scenarioInit";

export type TaxHomeHandlersCtx = {
  presets: ScenarioPreset[];
  availableYears: number[];
  defaultYear: number;
  taxInput: Accessor<TaxInput>;
  setTaxInput: Setter<TaxInput>;
  baselineInput: Accessor<TaxInput | null>;
  setBaselineInput: Setter<TaxInput | null>;
  taxResult: Accessor<ReturnType<typeof import("~/lib/taxCalc").calculateTaxes>>;
  showStatus: (message: string) => void;
};

export function createTaxHomeHandlers(ctx: TaxHomeHandlersCtx) {
  const copyText = async (text: string, successMessage: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      ctx.showStatus("Clipboard access is unavailable in this browser.");
      return;
    }
    await navigator.clipboard.writeText(text);
    ctx.showStatus(successMessage);
  };

  return {
    applyPreset: (presetId: string) => {
      const preset = ctx.presets.find(entry => entry.id === presetId);
      if (!preset) return;
      ctx.setTaxInput(preset.buildInput(ctx.taxInput().taxYear));
      ctx.showStatus(`Loaded preset: ${preset.label}.`);
    },
    copyShareLink: async () => {
      if (typeof window === "undefined") return;
      await copyText(window.location.href, "Share link copied.");
    },
    copySummary: async () => {
      const result = ctx.taxResult();
      if (!result) {
        ctx.showStatus("Enter a valid scenario first.");
        return;
      }
      await copyText(buildScenarioSummaryText(result), "Scenario summary copied.");
    },
    saveBaseline: () => {
      const current = cloneScenario(ctx.taxInput(), ctx.availableYears, ctx.defaultYear);
      ctx.setBaselineInput(current);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(BASELINE_SCENARIO_STORAGE_KEY, serializeScenarioInput(current));
      }
      ctx.showStatus("Current scenario saved as baseline.");
    },
    loadBaseline: () => {
      const saved = ctx.baselineInput();
      if (!saved) return;
      ctx.setTaxInput(cloneScenario(saved, ctx.availableYears, ctx.defaultYear));
      ctx.showStatus("Loaded saved baseline.");
    },
    clearBaseline: () => {
      ctx.setBaselineInput(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(BASELINE_SCENARIO_STORAGE_KEY);
      }
      ctx.showStatus("Baseline cleared.");
    },
    resetScenario: () => {
      ctx.setTaxInput(starterScenario(ctx.defaultYear));
      ctx.showStatus("Scenario reset to the starter example.");
    },
  };
}
