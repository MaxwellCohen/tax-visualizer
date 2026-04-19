import type { Accessor, Setter } from "solid-js";
import { getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { ScenarioPreset } from "~/lib/taxScenario.types";
import { starterScenario } from "~/routes/taxHome/scenarioInit";
import { buildUrlWithScenario } from "~/routes/taxHome/taxHomePersistence";

export type TaxHomeHandlersCtx = {
  presets: ScenarioPreset[];
  availableYears: number[];
  defaultYear: number;
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  showStatus: (message: string) => void;
  syncScenarioToUrl: () => void;
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
      if (!preset) {
        console.error("Preset not found:", presetId, "available:", ctx.presets.map(p => p.id).join(", "));
        ctx.showStatus(`Preset not found: ${presetId}`);
        return;
      }
      try {
        const year = getTaxYearFromRows(ctx.taxInput().rows);
        const newInput = preset.buildInput(year);
        ctx.setTaxInput(newInput);
        ctx.syncScenarioToUrl();
        ctx.showStatus(`Loaded preset: ${preset.label}.`);
      } catch (e) {
        console.error("Error building preset input:", e);
        ctx.showStatus("Error loading preset.");
      }
    },
    copyShareLink: async () => {
      if (typeof window === "undefined") return;
      const href = buildUrlWithScenario(window.location.href, ctx.taxInput());
      await copyText(href, "Share link copied.");
    },
   
    resetScenario: () => {
      ctx.setTaxInput(starterScenario(ctx.defaultYear));
      ctx.syncScenarioToUrl();
      ctx.showStatus("Scenario reset to the starter example.");
    },
  };
}
