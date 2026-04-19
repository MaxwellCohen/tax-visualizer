import { createSignal } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { ScenarioToolsActions } from "~/components/scenarioTools/ScenarioToolsActions";
import { ScenarioToolsPresets } from "~/components/scenarioTools/ScenarioToolsPresets";
import {
  createTaxHomeHandlers,
  type TaxHomeHandlersCtx,
} from "~/routes/taxHome/taxHomeHandlers";

type ScenarioToolsProps = Omit<TaxHomeHandlersCtx, "showStatus">;

export default function ScenarioTools(props: ScenarioToolsProps) {
  const [statusMessage, setStatusMessage] = createSignal<string | null>(null);

  let statusTimer: number | undefined;
  const showStatus = (message: string) => {
    setStatusMessage(message);
    if (typeof window === "undefined") return;
    if (statusTimer !== undefined) window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => setStatusMessage(null), 2500);
  };

  const handlers = createTaxHomeHandlers({
    presets: props.presets,
    availableYears: props.availableYears,
    defaultYear: props.defaultYear,
    taxInput: props.taxInput,
    setTaxInput: props.setTaxInput,
    showStatus,
    syncScenarioToUrl: props.syncScenarioToUrl,
  });
  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <CollapsibleBlock
        title="Scenario tools"
        bodyClass="mt-4 space-y-5"
        headerAside={
          <>
            {statusMessage() ? (
              <p
                class="rounded-lg px-3 py-2 text-xs"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                {statusMessage()}
              </p>
            ) : undefined}
          </>
        }
      >
        <p class="max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Try a starter scenario or share the current case. Your latest scenario is saved locally in
          this browser.
        </p>
        <ScenarioToolsPresets
          presets={props.presets}
          taxInput={props.taxInput}
          onApplyPreset={(id) => {
            handlers.applyPreset(id);
          }}
        />
        <ScenarioToolsActions
          onCopyShareLink={() => void handlers.copyShareLink()}
        />
      </CollapsibleBlock>
    </section>
  );
}
