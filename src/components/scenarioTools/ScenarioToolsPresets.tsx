import { onMount } from "solid-js";
import type { Accessor } from "solid-js";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { ScenarioPreset } from "~/lib/taxScenario.types";
import { taxInputMatchesPreset } from "~/lib/taxScenario";

type Props = {
  presets: ScenarioPreset[];
  taxInput: Accessor<TaxFormData>;
  onApplyPreset: (presetId: string) => void;
};

export function ScenarioToolsPresets(props: Props) {
  const ref = (el: HTMLDivElement) => {
    console.log("ScenarioToolsPresets mounted with", props.presets.length, "presets");
    const buttons = el?.querySelectorAll("button");
    console.log("Found", buttons?.length, "preset buttons");
    buttons?.forEach((btn, i) => {
      console.log(`Button ${i}:`, btn.textContent?.slice(0, 20));
    });
  };

  const handleClick = (presetId: string) => {
    console.log("DIRECT CLICK - presetId:", presetId);
    props.onApplyPreset(presetId);
  };
  return (
    <div 
      ref={ref}
      class="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      onClick={(e) => {
        console.log("DIV CLICK - target:", e.target?.tagName, "currentTarget:", e.currentTarget?.tagName);
      }}
    >
      {props.presets.map(preset => {
        const selected = () => taxInputMatchesPreset(props.taxInput(), preset);
        return (
        <button
          type="button"
          class="rounded-lg p-4 text-left transition-[color,background-color,box-shadow,outline-color]"
          classList={{
            "outline-2 outline-(--accent) outline-offset-2": selected(),
          }}
          style={{
            background: "var(--surface-alt)",
            border: "1px solid var(--border-subtle)",
          }}
          onClick={(e) => {
            console.log("BUTTON CLICK - preset:", preset.id);
            handleClick(preset.id);
          }}
        >
          <div
            class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
          >
            Preset
          </div>
          <div class="mt-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
            {preset.label}
          </div>
          <p class="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {preset.description}
          </p>
        </button>
        );
      })}
    </div>
  );
}
