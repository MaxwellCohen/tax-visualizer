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
import { effect } from "solid-js/web";
import { useSearchParams } from "@solidjs/router";
import { deserializeScenarioInputFromSearchParams, serializeScenarioInput } from "~/lib/taxScenario.serialize";
import { SCENARIO_QUERY_PARAM } from "~/lib/taxScenario.keys.constants";

export default function HomeContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? new Date().getFullYear();
  const presets = getScenarioPresets();
  const [taxInput, setTaxInput] = createSignal<TaxFormData>( 
    deserializeScenarioInputFromSearchParams(searchParams as Record<string, string>) || starterScenario(defaultYear)
  );
  const taxResult = createMemo(() => calculateTaxes(taxInput()));
  const isPlanningYear = createMemo(() => isPlanningTaxYear(getTaxYearFromRows(taxInput().rows)));
  const  syncScenarioToUrl  = () => {
    console.log("syncScenarioToUrl", serializeScenarioInput(taxInput()));
    setSearchParams({[SCENARIO_QUERY_PARAM]: serializeScenarioInput(taxInput())});
  }

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
        value={taxInput}
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
