import { createSignal } from "solid-js";
import { RouteSeo } from "~/components/seo/Seo";
import { HomeHeader } from "~/routes/taxHome/HomeHeader";
import { HomeTaxResults } from "~/routes/taxHome/HomeTaxResults";
import ScenarioTools from "~/components/tax/ScenarioTools";
import TaxInputForm from "~/components/tax/TaxInputForm";
import type { TaxFormData } from "~/lib/tax/form/types"
import { getAvailableTaxYears } from "~/lib/tax/data/accessors.impl";
import { getScenarioPresets } from "~/lib/tax/scenario/serialize";
import { starterScenario } from "~/routes/taxHome/scenarioInit";
import { useSearchParams } from "@solidjs/router";
import { deserializeScenarioInputFromSearchParams, serializeScenarioInput } from "~/lib/tax/scenario/serialize";
import { SCENARIO_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";
import { effect } from "solid-js/web";

export default function HomeContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? 2026;
  const presets = getScenarioPresets();
  const [taxInput, setTaxInput] = createSignal<TaxFormData>( 
    deserializeScenarioInputFromSearchParams(searchParams as Record<string, string>) || starterScenario(defaultYear)
  );
  const  syncScenarioToUrl  = () => {
    setSearchParams({[SCENARIO_QUERY_PARAM]: serializeScenarioInput(taxInput())});
  }

  effect(() => {
    console.log("taxInput", taxInput());
  });

  return (
    <main class="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <RouteSeo page="home" />
      <HomeHeader />
      <ScenarioTools
        presets={presets}
        taxInput={taxInput}
        setTaxInput={setTaxInput}
        syncScenarioToUrl={syncScenarioToUrl}
      />

      <TaxInputForm
        taxInput={taxInput}
        setTaxInput={setTaxInput}
        availableYears={availableYears}
        onCommitToUrl={syncScenarioToUrl}
      />

      <HomeTaxResults
        taxInput={taxInput}
      />
    </main>
  );
}
