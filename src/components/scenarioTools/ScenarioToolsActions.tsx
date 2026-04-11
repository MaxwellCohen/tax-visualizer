const buttonClass =
  "rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors";

type Props = {
  hasBaseline: boolean;
  onCopyShareLink: () => void;
  onCopySummary: () => void;
  onSaveBaseline: () => void;
  onLoadBaseline: () => void;
  onClearBaseline: () => void;
  onResetScenario: () => void;
};

export function ScenarioToolsActions(props: Props) {
  return (
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
  );
}
