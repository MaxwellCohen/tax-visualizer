import { createMemo, createSignal, onSettled, Show, untrack } from "solid-js";
import { isServer } from "@solidjs/web";
import { createNormalizedTaxInput } from "~/components/tax/inputForm/hooks/taxYearLimitsEffect";
import { useSearchParams } from "@solidjs/router";
import { RouteSeo } from "~/components/seo/Seo";
import { StickyHeadlineBar } from "~/components/layout/StickyHeadlineBar";
import ScenarioTools from "~/components/tax/ScenarioTools";
import TaxInputForm from "~/components/tax/TaxInputForm";
import { WithholdingHeader } from "~/components/tax/withholding/WithholdingHeader";
import { WithholdingResults } from "~/components/tax/withholding/WithholdingResults";
import { WithholdingSection } from "~/components/tax/withholding/WithholdingSection";
import { createTaxInputRowActions } from "~/components/tax/inputForm/hooks/taxInputRowActions";
import { useCalculatedTaxConfig } from "~/lib/tax/calc/useCalculatedTaxConfig";
import { getTaxYearFromRows } from "~/lib/tax/calc/inputs";
import {
  headlineMetricsFromCalculatedConfig,
  withholdingBalanceHeadline,
  type HeadlineMetric,
} from "~/lib/tax/charts/headlineMetrics";
import { getAvailableTaxYears } from "~/lib/tax/data/accessors.impl";
import type { TaxFormData } from "~/lib/tax/form/types";
import {
  persistScenarioLocally,
  persistWithholdingLocally,
} from "~/lib/tax/scenario/scenarioLocalPersistence";
import { SCENARIO_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";
import { getScenarioPresets } from "~/lib/tax/scenario/serialize";
import { resolveInitialScenario, storedScenarioIfNoUrl } from "~/routes/taxHome/scenarioInit";
import { encodedScenarioIfFitsUrl } from "~/routes/taxHome/taxHomePersistence";
import { TaxYearInvalid } from "~/routes/taxHome/TaxYearInvalid";
import {
  mergeWithholdingIntoSearchParams,
  resolveInitialWithholdingInputs,
  resolveWithholdingInputsForWageJobs,
  storedWithholdingIfNoUrl,
} from "~/routes/withholding/withholdingPersistence";
import type { WithholdingInputs } from "~/lib/tax/withholding/types";
import { deriveWageJobsFromTaxInput } from "~/lib/tax/withholding/wageJobs";
import { getFederalIncomeTaxLiability } from "~/lib/tax/withholding/getFederalIncomeTaxLiability";
import { clearedReadableScenarioParams } from "~/lib/tax/scenario/readableParams";

export default function WithholdingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? 2026;
  const presets = getScenarioPresets();

  const [taxInput, setTaxInput, clampNotice] = createNormalizedTaxInput(
    untrack(() => resolveInitialScenario(searchParams as Record<string, string>, defaultYear)),
  );

  const [withholdingInputs, setWithholdingInputs] = createSignal<WithholdingInputs>(
    untrack(() =>
      resolveInitialWithholdingInputs(
        searchParams as Record<string, string>,
        deriveWageJobsFromTaxInput(taxInput()),
      ),
    ),
  );

  onSettled(() => {
    if (isServer) return;
    const params = searchParams as Record<string, string>;
    const storedScenario = storedScenarioIfNoUrl(params);
    if (storedScenario) setTaxInput(storedScenario);
    const storedWithholding = storedWithholdingIfNoUrl(
      params,
      deriveWageJobsFromTaxInput(storedScenario ?? taxInput()),
    );
    if (storedWithholding) setWithholdingInputs(storedWithholding);
  });

  const wageJobs = createMemo(() => deriveWageJobsFromTaxInput(taxInput()));

  const effectiveWithholdingInputs = createMemo(() =>
    resolveWithholdingInputsForWageJobs(wageJobs(), withholdingInputs()),
  );

  const syncScenarioToUrl = (data?: TaxFormData) => {
    const current = data ?? taxInput();
    persistScenarioLocally(current);
    const href = typeof window === "undefined" ? "https://localhost/" : window.location.href;
    setSearchParams({
      ...searchParams,
      ...clearedReadableScenarioParams(searchParams),
      [SCENARIO_QUERY_PARAM]: encodedScenarioIfFitsUrl(href, current),
    });
  };

  const syncWithholdingToUrl = () => {
    persistWithholdingLocally(withholdingInputs());
    setSearchParams(mergeWithholdingIntoSearchParams(searchParams, withholdingInputs()));
  };

  const rowActions = createTaxInputRowActions(setTaxInput, syncScenarioToUrl);

  const applySingleW2Preset = () => {
    const preset = presets.find(p => p.id === "singleW2");
    if (!preset) return;
    const year = getTaxYearFromRows(taxInput().rows);
    const written = setTaxInput(preset.buildInput(year));
    syncScenarioToUrl(written);
  };

  const calculatedConfig = useCalculatedTaxConfig(taxInput);

  const headlineMetrics = createMemo((): HeadlineMetric[] => {
    const cc = calculatedConfig();
    if (!cc) return [];
    const metrics = headlineMetricsFromCalculatedConfig(cc, {
      taxScope: "incomeOnly",
    });
    const balance = withholdingBalanceHeadline(
      taxInput(),
      cc,
      effectiveWithholdingInputs(),
    );
    if (balance) metrics.push(balance);
    const liability = getFederalIncomeTaxLiability(cc);
    if (metrics.length === 0 && liability !== null) {
      metrics.push({
        label: "Annual federal income tax",
        value: liability,
        format: "currency",
        highlight: true,
      });
    }
    return metrics;
  });

  const formDefaultOpen = createMemo(() => wageJobs().length === 0);

  return (
    <main id="main-content" class="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <RouteSeo page="withholding" />
      <WithholdingHeader />
      <StickyHeadlineBar metrics={headlineMetrics} />
      <ScenarioTools
        presets={presets}
        taxInput={taxInput}
        setTaxInput={setTaxInput}
        syncScenarioToUrl={syncScenarioToUrl}
        variant="withholding"
        withholdingInputs={effectiveWithholdingInputs}
      />
      <WithholdingSection
        taxInput={taxInput}
        inputs={effectiveWithholdingInputs}
        setInputs={setWithholdingInputs}
        onCommitToUrl={syncWithholdingToUrl}
        onAddWageIncome={rowActions.addSource}
        onLoadSingleW2Preset={applySingleW2Preset}
      />
      <Show when={calculatedConfig() !== null} fallback={<TaxYearInvalid />}>
        <WithholdingResults
          taxInput={taxInput}
          calculatedConfig={calculatedConfig}
          withholdingInputs={effectiveWithholdingInputs}
        />
      </Show>
      <TaxInputForm
        taxInput={taxInput}
        setTaxInput={setTaxInput}
        availableYears={availableYears}
        onCommitToUrl={syncScenarioToUrl}
        defaultOpen={formDefaultOpen()}
        clampNotice={clampNotice}
      />
    </main>
  );
}
