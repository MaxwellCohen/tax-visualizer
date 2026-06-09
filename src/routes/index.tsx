import { createMemo, createSignal } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { RouteSeo } from "~/components/seo/Seo";
import { StickyHeadlineBar } from "~/components/layout/StickyHeadlineBar";
import { HomeHeader } from "~/routes/taxHome/HomeHeader";
import { HomeTaxResults } from "~/routes/taxHome/HomeTaxResults";
import ScenarioTools from "~/components/tax/ScenarioTools";
import TaxInputForm from "~/components/tax/TaxInputForm";
import type { TaxFormData } from "~/lib/tax/form/types";
import { getAvailableTaxYears } from "~/lib/tax/data/accessors.impl";
import { getScenarioPresets } from "~/lib/tax/scenario/serialize";
import { resolveInitialScenario } from "~/routes/taxHome/scenarioInit";
import { persistScenarioLocally } from "~/lib/tax/scenario/scenarioLocalPersistence";
import { SCENARIO_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";
import { serializeScenarioInput } from "~/lib/tax/scenario/serialize";
import { useCalculatedTaxConfig } from "~/lib/tax/calc/useCalculatedTaxConfig";
import { headlineMetricsFromCalculatedConfig } from "~/lib/tax/charts/headlineMetrics";

export default function HomeContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? 2026;
  const presets = getScenarioPresets();
  const [taxInput, setTaxInput] = createSignal<TaxFormData>(
    resolveInitialScenario(searchParams as Record<string, string>, defaultYear),
  );

  const syncScenarioToUrl = () => {
    persistScenarioLocally(taxInput());
    setSearchParams({ [SCENARIO_QUERY_PARAM]: serializeScenarioInput(taxInput()) });
  };

  const calculatedConfig = useCalculatedTaxConfig(taxInput);
  const headlineMetrics = createMemo(() =>
    headlineMetricsFromCalculatedConfig(calculatedConfig()),
  );

  return (
    <main class="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <RouteSeo page="home" />
      <HomeHeader />
      <StickyHeadlineBar metrics={headlineMetrics} />
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
      <HomeTaxResults taxInput={taxInput} calculatedConfig={calculatedConfig} />
    </main>
  );
}
