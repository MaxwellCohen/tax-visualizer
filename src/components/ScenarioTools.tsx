type ScenarioPresetOption = {
  id: string;
  label: string;
  description: string;
};

type ScenarioToolsProps = {
  presets: ScenarioPresetOption[];
  hasBaseline: boolean;
  statusMessage: string | null;
  onApplyPreset: (presetId: string) => void;
  onCopyShareLink: () => void;
  onCopySummary: () => void;
  onSaveBaseline: () => void;
  onLoadBaseline: () => void;
  onClearBaseline: () => void;
  onResetScenario: () => void;
};

const buttonClass =
  "rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors";

export default function ScenarioTools(props: ScenarioToolsProps) {
  return (
    <section
      class="space-y-5 rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <h2
            class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
          >
            Scenario tools
          </h2>
          <p class="max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Try a starter scenario, share the current case, or save a baseline to compare how one
            change affects take-home pay and taxes. Your latest scenario is saved locally in this
            browser.
          </p>
        </div>
        {props.statusMessage ? (
          <p
            class="rounded-lg px-3 py-2 text-xs"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
              border: "1px solid var(--border)",
            }}
          >
            {props.statusMessage}
          </p>
        ) : null}
      </div>

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

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class={buttonClass}
          style={{
            background: "var(--accent-muted)",
            color: "var(--accent)",
            border: "1px solid var(--border)",
          }}
          onClick={props.onCopyShareLink}
        >
          Copy share link
        </button>
        <button
          type="button"
          class={buttonClass}
          style={{
            background: "var(--surface-alt)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
          onClick={props.onCopySummary}
        >
          Copy summary
        </button>
        <button
          type="button"
          class={buttonClass}
          style={{
            background: "var(--surface-alt)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
          onClick={props.onSaveBaseline}
        >
          Save as baseline
        </button>
        <button
          type="button"
          class={buttonClass}
          style={{
            background: "var(--surface-alt)",
            color: props.hasBaseline ? "var(--text)" : "var(--text-faint)",
            border: "1px solid var(--border)",
          }}
          disabled={!props.hasBaseline}
          onClick={props.onLoadBaseline}
        >
          Load baseline
        </button>
        <button
          type="button"
          class={buttonClass}
          style={{
            background: "var(--surface-alt)",
            color: props.hasBaseline ? "var(--text)" : "var(--text-faint)",
            border: "1px solid var(--border)",
          }}
          disabled={!props.hasBaseline}
          onClick={props.onClearBaseline}
        >
          Clear baseline
        </button>
        <button
          type="button"
          class={buttonClass}
          style={{
            background: "var(--surface-alt)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
          onClick={props.onResetScenario}
        >
          Reset scenario
        </button>
      </div>
    </section>
  );
}
