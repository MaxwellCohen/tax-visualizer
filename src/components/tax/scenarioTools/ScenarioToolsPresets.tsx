
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
          class="rounded-lg border border-border-subtle bg-surface-alt p-4 text-left transition-[color,background-color,box-shadow,outline-color]"
          classList={{
            "outline-2 outline-accent outline-offset-2": selected(),
          }}
          onClick={() => {
            handleClick(preset.id);
          }}
        >
          <div class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
            Preset
          </div>
          <div class="mt-2 text-sm font-semibold text-foreground">
            {preset.label}
          </div>
          <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
            {preset.description}
          </p>
        </button>
        );
      })}
    </div>
  );
}
