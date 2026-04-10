import { Show, createEffect, createMemo, createSignal, onMount } from "solid-js";
import ScenarioTools from "~/components/ScenarioTools";
import TaxInputForm from "~/components/TaxInputForm";
import TaxMekko from "~/components/TaxMekko";
import TaxModelGuide from "~/components/TaxModelGuide";
import TaxNarrative from "~/components/TaxNarrative";
import TaxSankey from "~/components/TaxSankey";
import TaxSummary from "~/components/TaxSummary";
import TaxWarnings from "~/components/TaxWarnings";
import { calculateTaxes, newIncomeSource, type TaxInput } from "~/lib/taxCalc";
import { buildMekkoRows, buildSankeyChartData } from "~/lib/taxCharts";
import { getAvailableTaxYears, isPlanningTaxYear } from "~/lib/taxData";
import {
  BASELINE_SCENARIO_STORAGE_KEY,
  SAVED_SCENARIO_STORAGE_KEY,
  SCENARIO_QUERY_PARAM,
  buildScenarioSummaryText,
  deserializeScenarioInput,
  getScenarioPresets,
  serializeScenarioInput,
} from "~/lib/taxScenario";

function starterScenario(taxYear: number): TaxInput {
  return {
    taxYear,
    filingStatus: "single",
    incomeSources: [newIncomeSource({ kind: "wages", amount: 90_000 })],
    preTax401kSpouse1: 0,
    preTax401kSpouse2: 0,
    preTaxHsaSpouse1: 0,
    preTaxHsaSpouse2: 0,
    preTaxOther: 0,
    traditionalIraSpouse1: 0,
    traditionalIraSpouse2: 0,
    useItemizedDeductions: false,
    itemizedDeductions: 0,
  };
}

function cloneScenario(input: TaxInput, availableYears: number[], fallbackYear: number): TaxInput {
  return (
    deserializeScenarioInput(serializeScenarioInput(input), availableYears, fallbackYear) ??
    starterScenario(fallbackYear)
  );
}

export default function Home() {
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? new Date().getFullYear();
  const presets = getScenarioPresets();
  const [taxInput, setTaxInput] = createSignal<TaxInput>(starterScenario(defaultYear));
  const [baselineInput, setBaselineInput] = createSignal<TaxInput | null>(null);
  const [storageReady, setStorageReady] = createSignal(false);
  const [statusMessage, setStatusMessage] = createSignal<string | null>(null);

  const taxResult = createMemo(() => calculateTaxes(taxInput()));
  const baselineResult = createMemo(() => {
    const saved = baselineInput();
    return saved ? calculateTaxes(saved) : null;
  });
  const sankeyData = createMemo(() => {
    const result = taxResult();
    return result ? buildSankeyChartData(result) : null;
  });
  const mekkoRows = createMemo(() => {
    const result = taxResult();
    return result ? buildMekkoRows(result) : [];
  });
  const isPlanningYear = createMemo(() => isPlanningTaxYear(taxInput().taxYear));

  let statusTimer: number | undefined;

  const showStatus = (message: string) => {
    setStatusMessage(message);
    if (typeof window === "undefined") return;
    if (statusTimer !== undefined) {
      window.clearTimeout(statusTimer);
    }
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

  const applyPreset = (presetId: string) => {
    const preset = presets.find(entry => entry.id === presetId);
    if (!preset) return;
    setTaxInput(preset.buildInput(taxInput().taxYear));
    showStatus(`Loaded preset: ${preset.label}.`);
  };

  const copyShareLink = async () => {
    if (typeof window === "undefined") return;
    await copyText(window.location.href, "Share link copied.");
  };

  const copySummary = async () => {
    const result = taxResult();
    if (!result) {
      showStatus("Enter a valid scenario first.");
      return;
    }
    await copyText(buildScenarioSummaryText(result), "Scenario summary copied.");
  };

  const saveBaseline = () => {
    const current = cloneScenario(taxInput(), availableYears, defaultYear);
    setBaselineInput(current);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        BASELINE_SCENARIO_STORAGE_KEY,
        serializeScenarioInput(current),
      );
    }
    showStatus("Current scenario saved as baseline.");
  };

  const loadBaseline = () => {
    const saved = baselineInput();
    if (!saved) return;
    setTaxInput(cloneScenario(saved, availableYears, defaultYear));
    showStatus("Loaded saved baseline.");
  };

  const clearBaseline = () => {
    setBaselineInput(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(BASELINE_SCENARIO_STORAGE_KEY);
    }
    showStatus("Baseline cleared.");
  };

  const resetScenario = () => {
    setTaxInput(starterScenario(defaultYear));
    showStatus("Scenario reset to the starter example.");
  };

  onMount(() => {
    const url = new URL(window.location.href);
    const sharedScenario = url.searchParams.get(SCENARIO_QUERY_PARAM);
    const urlInput = sharedScenario
      ? deserializeScenarioInput(sharedScenario, availableYears, defaultYear)
      : null;
    const storedScenario = window.localStorage.getItem(SAVED_SCENARIO_STORAGE_KEY);
    const savedInput = storedScenario
      ? deserializeScenarioInput(storedScenario, availableYears, defaultYear)
      : null;
    const storedBaseline = window.localStorage.getItem(BASELINE_SCENARIO_STORAGE_KEY);
    const savedBaseline = storedBaseline
      ? deserializeScenarioInput(storedBaseline, availableYears, defaultYear)
      : null;

    if (urlInput) {
      setTaxInput(urlInput);
    } else if (savedInput) {
      setTaxInput(savedInput);
    }

    if (savedBaseline) {
      setBaselineInput(savedBaseline);
    }

    setStorageReady(true);
  });

  createEffect(() => {
    if (!storageReady() || typeof window === "undefined") return;
    const encoded = serializeScenarioInput(taxInput());
    const url = new URL(window.location.href);
    url.searchParams.set(SCENARIO_QUERY_PARAM, encoded);
    window.history.replaceState({}, "", url);
    window.localStorage.setItem(SAVED_SCENARIO_STORAGE_KEY, encoded);
  });

  return (
    <main class="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header class="space-y-2">
        <h1
          class="text-3xl font-semibold tracking-tight"
          style={{ "font-family": "var(--font-heading)", color: "var(--text)" }}
        >
          US Tax Visualizer
        </h1>
        <p class="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Enter your filing details below to see how gross income flows through deductions, pre-tax
          payroll benefits, separate federal treatment of ordinary income (progressive brackets) vs
          long-term capital gains (0% / 15% / 20%), payroll taxes on wages, and take-home pay.
        </p>
        <p class="max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Use a preset if you want a fast tour, then save a baseline and change one variable at a
          time to see what really moved the result.
        </p>
      </header>

      <ScenarioTools
        presets={presets}
        hasBaseline={baselineInput() != null}
        statusMessage={statusMessage()}
        onApplyPreset={applyPreset}
        onCopyShareLink={() => void copyShareLink()}
        onCopySummary={() => void copySummary()}
        onSaveBaseline={saveBaseline}
        onLoadBaseline={loadBaseline}
        onClearBaseline={clearBaseline}
        onResetScenario={resetScenario}
      />

      <TaxInputForm value={taxInput()} availableYears={availableYears} onChange={setTaxInput} />

      <Show
        when={taxResult()}
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
            <TaxSummary result={result()} baselineResult={baselineResult()} />
            <TaxNarrative result={result()} isPlanningYear={isPlanningYear()} />
            <TaxSankey data={sankeyData() ?? { nodes: [], links: [] }} />
            <TaxMekko result={result()} rows={mekkoRows()} />
            <TaxModelGuide result={result()} isPlanningYear={isPlanningYear()} />
          </>
        )}
      </Show>
    </main>
  );
}
