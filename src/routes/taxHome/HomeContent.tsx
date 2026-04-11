import { Show } from "solid-js";
import { RouteSeo } from "~/components/Seo";
import { HomeHeader } from "~/routes/taxHome/HomeHeader";
import ScenarioTools from "~/components/ScenarioTools";
import TaxInputForm from "~/components/TaxInputForm";
import TaxMekko from "~/components/TaxMekko";
import TaxModelGuide from "~/components/TaxModelGuide";
import TaxNarrative from "~/components/TaxNarrative";
import TaxSankey from "~/components/TaxSankey";
import TaxSummary from "~/components/TaxSummary";
import TaxWarnings from "~/components/TaxWarnings";
import type { TaxInput } from "~/lib/taxCalc";
import type { MekkoRow, SankeyChartData } from "~/lib/taxCharts";
import type { TaxResult } from "~/lib/taxCalc";
import type { ScenarioPreset } from "~/lib/taxScenario.types";

type Handlers = {
  applyPreset: (id: string) => void;
  copyShareLink: () => void;
  copySummary: () => void;
  saveBaseline: () => void;
  loadBaseline: () => void;
  clearBaseline: () => void;
  resetScenario: () => void;
};

type Props = {
  presets: ScenarioPreset[];
  hasBaseline: boolean;
  statusMessage: string | null;
  handlers: Handlers;
  taxInput: TaxInput;
  availableYears: number[];
  onTaxInputChange: (v: TaxInput) => void;
  taxResult: TaxResult | null | undefined;
  baselineResult: TaxResult | null;
  sankeyData: SankeyChartData | null;
  mekkoRows: MekkoRow[];
  isPlanningYear: boolean;
};

export function HomeContent(props: Props) {
  return (
    <main class="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <RouteSeo page="home" />
      <HomeHeader />

      <ScenarioTools
        presets={props.presets}
        hasBaseline={props.hasBaseline}
        statusMessage={props.statusMessage}
        onApplyPreset={props.handlers.applyPreset}
        onCopyShareLink={() => void props.handlers.copyShareLink()}
        onCopySummary={() => void props.handlers.copySummary()}
        onSaveBaseline={props.handlers.saveBaseline}
        onLoadBaseline={props.handlers.loadBaseline}
        onClearBaseline={props.handlers.clearBaseline}
        onResetScenario={props.handlers.resetScenario}
      />

      <TaxInputForm
        value={props.taxInput}
        availableYears={props.availableYears}
        onChange={props.onTaxInputChange}
      />

      <Show
        when={props.taxResult}
        fallback={
          <p
            class="rounded-lg px-4 py-3 text-sm"
            style={{
              background: "var(--warning-bg)",
              border: "1px solid var(--warning-border)",
              color: "var(--warning-text)",
            }}
          >
            Invalid tax year selected.
          </p>
        }
      >
        {result => (
          <>
            <TaxWarnings warnings={result().warnings} />
            <TaxSummary result={result()} baselineResult={props.baselineResult} />
            <TaxNarrative result={result()} isPlanningYear={props.isPlanningYear} />
            <TaxSankey data={props.sankeyData ?? { nodes: [], links: [] }} />
            <TaxMekko result={result()} rows={props.mekkoRows} />
            <TaxModelGuide result={result()} isPlanningYear={props.isPlanningYear} />
          </>
        )}
      </Show>
    </main>
  );
}
