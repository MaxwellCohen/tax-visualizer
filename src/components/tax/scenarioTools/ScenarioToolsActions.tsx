const buttonClass =
  "rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors";

type Props = {
  onCopyShareLink: () => void;
};

export function ScenarioToolsActions(props: Props) {
  return (
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class={buttonClass}
        style={{
          background: "var(--color-accent-muted)",
          color: "var(--color-accent)",
          border: "1px solid var(--color-border)",
        }}
        onClick={props.onCopyShareLink}
      >
        Copy share link
      </button>
    </div>
  );
}
