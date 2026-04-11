import { createMemo, createSignal } from "solid-js";
import { getAvailableTaxYears, isPlanningTaxYear } from "~/lib/taxData";
import { calculateTaxes, type TaxInput } from "~/lib/taxCalc";
import { buildMekkoRows, buildSankeyChartData } from "~/lib/taxCharts";
import { getScenarioPresets } from "~/lib/taxScenario";
import { createTaxHomeHandlers } from "~/routes/taxHome/taxHomeHandlers";
import { HomeContent } from "~/routes/taxHome/HomeContent";
import { starterScenario } from "~/routes/taxHome/scenarioInit";
import { wireTaxHomePersistence } from "~/routes/taxHome/taxHomePersistence";

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
    if (statusTimer !== undefined) window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => setStatusMessage(null), 2500);
  };

  const handlers = createTaxHomeHandlers({
    presets,
    availableYears,
    defaultYear,
    taxInput,
    setTaxInput,
    baselineInput,
    setBaselineInput,
    taxResult,
    showStatus,
  });

  wireTaxHomePersistence({
    storageReady,
    setStorageReady,
    taxInput,
    setTaxInput,
    setBaselineInput,
    availableYears,
    defaultYear,
  });

  return (
    <HomeContent
      presets={presets}
      hasBaseline={baselineInput() != null}
      statusMessage={statusMessage()}
      handlers={handlers}
      taxInput={taxInput()}
      availableYears={availableYears}
      onTaxInputChange={setTaxInput}
      taxResult={taxResult()}
      baselineResult={baselineResult()}
      sankeyData={sankeyData()}
      mekkoRows={mekkoRows()}
      isPlanningYear={isPlanningYear()}
    />
  );
}
