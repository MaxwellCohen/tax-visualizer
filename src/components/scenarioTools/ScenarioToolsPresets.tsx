type Preset = { id: string; label: string; description: string };

type Props = {
  presets: Preset[];
  onApplyPreset: (presetId: string) => void;
};

export function ScenarioToolsPresets(props: Props) {
  return (
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {props.presets.map(preset => (
        <button
          type="button"
          class="rounded-lg p-4 text-left transition-colors"
          style={{
            background: "var(--surface-alt)",
            border: "1px solid var(--border-subtle)",
          }}
          onClick={() => props.onApplyPreset(preset.id)}
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
      ))}
    </div>
  );
}
