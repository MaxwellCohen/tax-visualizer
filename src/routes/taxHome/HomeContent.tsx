import { createMemo, createSignal, Show } from "solid-js";
import { RouteSeo } from "~/components/Seo";
import { HomeHeader } from "~/routes/taxHome/HomeHeader";
import ScenarioTools from "~/components/ScenarioTools";
import TaxInputForm from "~/components/TaxInputForm";
import TaxMekko from "~/components/TaxMekko";
import TaxModelGuide from "~/components/TaxModelGuide";
import TaxNarrative from "~/components/TaxNarrative";
import TaxSankey from "~/components/TaxSankey";
import TaxSummary from "~/components/TaxSummary";
import { calculateTaxes, calculateAllConfigValues, type CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import type { TaxFormData } from "~/lib/taxForm.types";
import { getTaxYearFromRows, getFilingStatusFromRows } from "~/lib/taxCalc.inputs";
import { getAvailableTaxYears, getTaxYearConfig, isPlanningTaxYear } from "~/lib/taxData";
import { getScenarioPresets } from "~/lib/taxScenario";
import { starterScenario } from "~/routes/taxHome/scenarioInit";
import { wireTaxHomePersistence } from "~/routes/taxHome/taxHomePersistence";
import { TaxYearInvalid } from "./TaxYearInvalid";

export function HomeContent() {
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? new Date().getFullYear();
  const presets = getScenarioPresets();
  const [taxInput, setTaxInput] = createSignal<TaxFormData>(starterScenario(defaultYear));
  const [baselineInput, setBaselineInput] = createSignal<TaxFormData | null>(null);

  const handleSetTaxInput = (newValue: TaxFormData) => {
    setTaxInput(newValue);
  };

  const taxResult = createMemo(() => {
    return calculateTaxes(taxInput());
  });
  
  const baselineResult = createMemo(() => {
    const saved = baselineInput();
    return saved ? calculateTaxes(saved) : null;
  });
  const isPlanningYear = createMemo(() => isPlanningTaxYear(getTaxYearFromRows(taxInput().rows)));

  const calculatedConfig = createMemo((): CalculatedConfigItem[] | null => {
    const input = taxInput();
    const rows = input.rows;
    const taxYear = getTaxYearFromRows(rows);
    const taxData = getTaxYearConfig(taxYear);
    if (!taxData) return null;
    const filingStatus = getFilingStatusFromRows(rows);
    return calculateAllConfigValues(input, taxData, filingStatus);
  });

  wireTaxHomePersistence({
    taxInput,
    setTaxInput,
    setBaselineInput,
  });

  return (
    <main class="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <RouteSeo page="home" />
      <HomeHeader />

      <ScenarioTools
        presets={presets}
        availableYears={availableYears}
        defaultYear={defaultYear}
        taxInput={taxInput}
        setTaxInput={setTaxInput}
        baselineInput={baselineInput}
        setBaselineInput={setBaselineInput}
        taxResult={taxResult}
      />

      <TaxInputForm
        value={taxInput()}
        availableYears={availableYears}
        onChange={handleSetTaxInput}
      />

      <Show when={taxResult()} fallback={<TaxYearInvalid />}>
        {(result) => (
          <>
            <TaxSankey calculatedConfig={calculatedConfig()} />
            <TaxMekko result={result()} calculatedConfig={calculatedConfig()} />
            <TaxSummary
              result={result()}
              baselineResult={baselineResult()}
            />
            <TaxNarrative
              result={result()}
              isPlanningYear={isPlanningYear()}
            />
            <TaxModelGuide
              result={result()}
              isPlanningYear={isPlanningYear()}
            />
          </>
        )}
      </Show>
    </main>
  );
}
