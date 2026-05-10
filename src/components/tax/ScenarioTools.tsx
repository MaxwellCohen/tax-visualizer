import { Accessor, createSignal, Setter } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import { ScenarioToolsActions } from "~/components/tax/scenarioTools/ScenarioToolsActions";
import { ScenarioToolsPresets } from "~/components/tax/scenarioTools/ScenarioToolsPresets";
import { buildUrlWithScenario } from "~/routes/taxHome/taxHomePersistence";
import { getTaxYearFromRows } from "~/lib/tax/calc/inputs";
import { TaxFormData } from "~/lib/tax/form/types";
import { ScenarioPreset } from "~/lib/tax/scenario/types";

type ScenarioToolsProps = {
  presets: ScenarioPreset[];
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  syncScenarioToUrl: () => void;
};

export default function ScenarioTools(props: ScenarioToolsProps) {
  const [statusMessage, setStatusMessage] = createSignal<string | null>(null);

  let statusTimer: number | undefined;
  const showStatus = (message: string) => {
    setStatusMessage(message);
    if (typeof window === "undefined") return;
    if (statusTimer !== undefined) window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => setStatusMessage(null), 2500);
  };

  const copyText = async (text: string, successMessage: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      showStatus("Clipboard access is unavailable in this browser.");
      return;
    }
    await navigator.clipboard.writeText(text);
    showStatus(successMessage);
  };

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
        <p
          class="max-w-3xl text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Try a starter scenario or share the current case. Your latest scenario
          is saved locally in this browser.
        </p>
        <ScenarioToolsPresets
          presets={props.presets}
          taxInput={props.taxInput}
          onApplyPreset={(id: string) => {
            const preset = props.presets.find((entry) => entry.id === id);
            if (!preset) {
              console.error(
                "Preset not found:",
                id,
                "available:",
                props.presets.map((p) => p.id).join(", "),
              );
              showStatus(`Preset not found: ${id}`);
              return;
            }
            try {
              const year = getTaxYearFromRows(props.taxInput().rows);
              const newInput = preset.buildInput(year);
              props.setTaxInput(newInput);
              props.syncScenarioToUrl();
              showStatus(`Loaded preset: ${preset.label}.`);
            } catch (e) {
              console.error("Error building preset input:", e);
              showStatus("Error loading preset.");
            }
          }}
        />
        <ScenarioToolsActions
          onCopyShareLink={async () => {
            if (typeof window === "undefined") return;
            const href = buildUrlWithScenario(
              window.location.href,
              props.taxInput(),
            );
            await copyText(href, "Share link copied.");
          }}
        />
      </CollapsibleBlock>
    </section>
  );
}
