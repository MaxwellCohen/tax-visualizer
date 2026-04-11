import { ScenarioToolsActions } from "~/components/scenarioTools/ScenarioToolsActions";
import { ScenarioToolsPresets } from "~/components/scenarioTools/ScenarioToolsPresets";

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

      <ScenarioToolsPresets presets={props.presets} onApplyPreset={props.onApplyPreset} />

      <ScenarioToolsActions
        hasBaseline={props.hasBaseline}
        onCopyShareLink={props.onCopyShareLink}
        onCopySummary={props.onCopySummary}
        onSaveBaseline={props.onSaveBaseline}
        onLoadBaseline={props.onLoadBaseline}
        onClearBaseline={props.onClearBaseline}
        onResetScenario={props.onResetScenario}
      />
    </section>
  );
}
