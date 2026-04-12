import { createMemo, createSignal } from "solid-js";
import { RouteSeo } from "~/components/Seo";
import { HomeHeader } from "~/routes/taxHome/HomeHeader";
import { HomeTaxResults } from "~/routes/taxHome/HomeTaxResults";
import ScenarioTools from "~/components/ScenarioTools";
import TaxInputForm from "~/components/TaxInputForm";
import { calculateTaxes, type TaxFormData } from "~/lib/taxCalc";
import { getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { getAvailableTaxYears, isPlanningTaxYear } from "~/lib/taxData";
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

  wireTaxHomePersistence({
    taxInput,
    setTaxInput,
    setBaselineInput,
  });
  effect(() => {
    console.log("taxInput", taxInput());
    console.log("taxResult", taxResult());
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
      />
    </main>
  );
}
