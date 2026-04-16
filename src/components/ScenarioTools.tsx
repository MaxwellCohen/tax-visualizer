import { createSignal, Show } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { ScenarioToolsActions } from "~/components/scenarioTools/ScenarioToolsActions";
import { ScenarioToolsPresets } from "~/components/scenarioTools/ScenarioToolsPresets";
import {
  createTaxHomeHandlers,
  type TaxHomeHandlersCtx,
} from "~/routes/taxHome/taxHomeHandlers";

export type ScenarioToolsProps = Omit<TaxHomeHandlersCtx, "showStatus">;

export default function ScenarioTools(props: ScenarioToolsProps) {
  const [statusMessage, setStatusMessage] = createSignal<string | null>(null);
  const [debugApplyCount, setDebugApplyCount] = createSignal(0);

  let statusTimer: number | undefined;
  const showStatus = (message: string) => {
    console.log("showStatus called:", message);
    setStatusMessage(message);
    if (typeof window === "undefined") return;
    if (statusTimer !== undefined) window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => setStatusMessage(null), 2500);
  };

  const wrappedSetTaxInput: typeof props.setTaxInput = (...args: Parameters<typeof props.setTaxInput>) => {
    console.log("ScenarioTools setTaxInput called, args:", args);
    props.setTaxInput(...args);
  };

  const handlers = createTaxHomeHandlers({
    presets: props.presets,
    availableYears: props.availableYears,
    defaultYear: props.defaultYear,
    taxInput: props.taxInput,
    setTaxInput: wrappedSetTaxInput,
    baselineInput: props.baselineInput,
    setBaselineInput: props.setBaselineInput,
    taxResult: props.taxResult,
    showStatus,
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
          Try a starter scenario, share the current case, or save a baseline to compare how one
          change affects take-home pay and taxes. Your latest scenario is saved locally in this
          browser.
        </p>
        <ScenarioToolsPresets
          presets={props.presets}
          taxInput={props.taxInput}
          onApplyPreset={(id) => {
            console.log("WRAPPER - onApplyPreset called with:", id);
            handlers.applyPreset(id);
            console.log("WRAPPER - handlers.applyPreset returned");
          }}
        />
        <ScenarioToolsActions
          hasBaseline={props.baselineInput() != null}
          onCopyShareLink={() => void handlers.copyShareLink()}
          onCopySummary={() => void handlers.copySummary()}
          onSaveBaseline={handlers.saveBaseline}
          onLoadBaseline={handlers.loadBaseline}
          onClearBaseline={handlers.clearBaseline}
          onResetScenario={handlers.resetScenario}
        />
      </CollapsibleBlock>
    </section>
  );
}
