import { createMemo, createSignal } from "solid-js";
import { RouteSeo } from "~/components/Seo";
import { HomeHeader } from "~/routes/taxHome/HomeHeader";
import { HomeTaxResults } from "~/routes/taxHome/HomeTaxResults";
import ScenarioTools from "~/components/ScenarioTools";
import TaxInputForm from "~/components/TaxInputForm";
import { calculateTaxes, calculateAllConfigValues, type CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import type { TaxFormData } from "~/lib/taxForm.types";
import { getTaxYearFromRows, getFilingStatusFromRows } from "~/lib/taxCalc.inputs";
import { getAvailableTaxYears, isPlanningTaxYear, getTaxYearConfig } from "~/lib/taxData";
import { getScenarioPresets } from "~/lib/taxScenario";
import { starterScenario } from "~/routes/taxHome/scenarioInit";
import { wireTaxHomePersistence } from "~/routes/taxHome/taxHomePersistence";
import { effect } from "solid-js/web";

export default function HomeContent() {
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? new Date().getFullYear();
  const presets = getScenarioPresets();
  const [taxInput, setTaxInput] = createSignal<TaxFormData>(starterScenario(defaultYear));
  const [baselineInput, setBaselineInput] = createSignal<TaxFormData | null>(null);

  const taxResult = createMemo(() => calculateTaxes(taxInput()));
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
  effect(() => {
    console.log("taxInput", taxInput());
    console.log("taxResult", taxResult());
    console.log("calculatedConfig", calculatedConfig());
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
        onChange={setTaxInput}
      />

      <HomeTaxResults
        taxResult={taxResult}
        baselineResult={baselineResult}
        isPlanningYear={isPlanningYear}
        calculatedConfig={calculatedConfig}
      />
    </main>
  );
}
