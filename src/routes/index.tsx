import { createMemo, onSettled, untrack } from "solid-js";
import { isServer } from "@solidjs/web";
import { useSearchParams } from "@solidjs/router";
import { RouteSeo } from "~/components/seo/Seo";
import { StickyHeadlineBar } from "~/components/layout/StickyHeadlineBar";
import { HomeHeader } from "~/routes/taxHome/HomeHeader";
import { HomeTaxResults } from "~/routes/taxHome/HomeTaxResults";
import ScenarioTools from "~/components/tax/ScenarioTools";
import TaxInputForm from "~/components/tax/TaxInputForm";
import { getAvailableTaxYears } from "~/lib/tax/data/accessors.impl";
import type { TaxFormData } from "~/lib/tax/form/types";
import { getScenarioPresets } from "~/lib/tax/scenario/serialize";
import { resolveInitialScenario, storedScenarioIfNoUrl } from "~/routes/taxHome/scenarioInit";
import { persistScenarioLocally } from "~/lib/tax/scenario/scenarioLocalPersistence";
import { SCENARIO_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";
import { useCalculatedTaxConfig } from "~/lib/tax/calc/useCalculatedTaxConfig";
import { headlineMetricsFromCalculatedConfig } from "~/lib/tax/charts/headlineMetrics";
import { createNormalizedTaxInput } from "~/components/tax/inputForm/hooks/taxYearLimitsEffect";
import { encodedScenarioIfFitsUrl } from "~/routes/taxHome/taxHomePersistence";
import { clearedReadableScenarioParams } from "~/lib/tax/scenario/readableParams";

export default function HomeContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? 2026;
  const presets = getScenarioPresets();
  const [taxInput, setTaxInput, clampNotice] = createNormalizedTaxInput(
    untrack(() => resolveInitialScenario(searchParams as Record<string, string>, defaultYear)),
  );

  onSettled(() => {
    if (isServer) return;
    const stored = storedScenarioIfNoUrl(searchParams as Record<string, string>);
    if (stored) setTaxInput(stored);
  });

  const syncScenarioToUrl = (data?: TaxFormData) => {
    const current = data ?? taxInput();
    persistScenarioLocally(current);
    const href = typeof window === "undefined" ? "https://localhost/" : window.location.href;
    setSearchParams({
      ...clearedReadableScenarioParams(searchParams),
      [SCENARIO_QUERY_PARAM]: encodedScenarioIfFitsUrl(href, current),
    });
  };

  const calculatedConfig = useCalculatedTaxConfig(taxInput);
  const headlineMetrics = createMemo(() =>
    headlineMetricsFromCalculatedConfig(calculatedConfig()),
  );

  return (
    <main id="main-content" class="mx-auto max-w-6xl space-y-8 px-4 py-8">
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
        clampNotice={clampNotice}
      />
      <HomeTaxResults taxInput={taxInput} calculatedConfig={calculatedConfig} />
    </main>
  );
}
