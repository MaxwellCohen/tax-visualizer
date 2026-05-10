
import type { Accessor } from "solid-js";
import type { TaxFormData } from "~/lib/tax/form/types";
import type { ScenarioPreset } from "~/lib/tax/scenario/types";
import { taxInputMatchesPreset } from "~/lib/tax/scenario/compare";

type Props = {
  presets: ScenarioPreset[];
  taxInput: Accessor<TaxFormData>;
  onApplyPreset: (presetId: string) => void;
};

export function ScenarioToolsPresets(props: Props) {
  const handleClick = (presetId: string) => {
    props.onApplyPreset(presetId);
  };
  return (
    <div 
      class="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {props.presets.map(preset => {
        const selected = () => taxInputMatchesPreset(props.taxInput(), preset);
        return (
        <button
          type="button"
          class="rounded-lg p-4 text-left transition-[color,background-color,box-shadow,outline-color]"
          classList={{
            "outline-2 outline-(--color-accent) outline-offset-2": selected(),
          }}
          style={{
            background: "var(--color-surface-alt)",
            border: "1px solid var(--color-border-subtle)",
          }}
          onClick={() => {
            handleClick(preset.id);
          }}
        >
          <div
            class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--color-faint-foreground)", "font-family": "var(--font-heading)" }}
          >
            Preset
          </div>
          <div class="mt-2 text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {preset.label}
          </div>
          <p class="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
            {preset.description}
          </p>
        </button>
        );
      })}
    </div>
  );
}
