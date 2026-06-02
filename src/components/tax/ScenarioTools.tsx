import { Accessor, createSignal, Setter } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import { ScenarioToolsActions } from "~/components/tax/scenarioTools/ScenarioToolsActions";
import { ScenarioToolsPresets } from "~/components/tax/scenarioTools/ScenarioToolsPresets";
import { buildUrlWithScenario } from "~/routes/taxHome/taxHomePersistence";
import { buildWithholdingShareUrl } from "~/routes/withholding/withholdingPersistence";
import { getTaxYearFromRows } from "~/lib/tax/calc/inputs";
import { TaxFormData } from "~/lib/tax/form/types";
import { ScenarioPreset } from "~/lib/tax/scenario/types";
import type { WithholdingInputs } from "~/lib/tax/withholding/types";

type ScenarioToolsProps = {
  presets: ScenarioPreset[];
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  syncScenarioToUrl: () => void;
  variant?: "home" | "withholding";
  withholdingInputs?: Accessor<WithholdingInputs>;
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
    <section class="rounded-xl border border-border bg-surface p-5 shadow-card">
      <CollapsibleBlock
        title="Scenario tools"
        bodyClass="mt-4 space-y-5"
        headerAside={
          <>
            {statusMessage() ? (
              <p class="rounded-lg border border-border bg-accent-muted px-3 py-2 text-xs text-accent">
                {statusMessage()}
              </p>
            ) : undefined}
          </>
        }
      >
        <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Try a starter scenario or share the current case. Your scenario is saved in this
          browser and encoded in the URL when you copy a share link or leave a field.
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
            const href =
              props.variant === "withholding" && props.withholdingInputs
                ? buildWithholdingShareUrl(
                    window.location.origin,
                    props.taxInput(),
                    props.withholdingInputs(),
                  )
                : buildUrlWithScenario(window.location.href, props.taxInput());
            await copyText(href, "Share link copied.");
          }}
        />
      </CollapsibleBlock>
    </section>
  );
}
