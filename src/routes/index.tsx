import { createMemo, createSignal } from "solid-js";
import { RouteSeo } from "~/components/Seo";
import { HomeHeader } from "~/routes/taxHome/HomeHeader";
import { HomeTaxResults } from "~/routes/taxHome/HomeTaxResults";
import ScenarioTools from "~/components/ScenarioTools";
import TaxInputForm from "~/components/TaxInputForm";
import { calculateTaxes } from "~/lib/taxCalc.calculateTaxes";
import type { TaxFormData } from "~/lib/taxForm.types"
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

  const taxResult = createMemo(() => calculateTaxes(taxInput()));
  const isPlanningYear = createMemo(() => isPlanningTaxYear(getTaxYearFromRows(taxInput().rows)));



  const { syncScenarioToUrl } = wireTaxHomePersistence({
    taxInput,
    setTaxInput
  });


  effect(() => {
    console.log("root taxInput", taxInput());
    console.log("root taxResult", taxResult());
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
        syncScenarioToUrl={syncScenarioToUrl}
      />

      <TaxInputForm
        value={taxInput()}
        availableYears={availableYears}
        onChange={setTaxInput}
        onCommitToUrl={syncScenarioToUrl}
      />

      <HomeTaxResults
        taxResult={taxResult}
        taxInput={taxInput}
        isPlanningYear={isPlanningYear}
      />
    </main>
  );
}
