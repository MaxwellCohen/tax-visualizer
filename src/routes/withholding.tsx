import { createMemo, createSignal, Show } from "solid-js";
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
import { getScenarioPresets, serializeScenarioInput } from "~/lib/tax/scenario/serialize";
import { resolveInitialScenario } from "~/routes/taxHome/scenarioInit";
import { TaxYearInvalid } from "~/routes/taxHome/TaxYearInvalid";
import {
  mergeWithholdingIntoSearchParams,
  resolveInitialWithholdingInputs,
  resolveWithholdingInputsForWageJobs,
} from "~/routes/withholding/withholdingPersistence";
import type { WithholdingInputs } from "~/lib/tax/withholding/types";
import { deriveWageJobsFromTaxInput } from "~/lib/tax/withholding/wageJobs";
import { getFederalIncomeTaxLiability } from "~/lib/tax/withholding/getFederalIncomeTaxLiability";

export default function WithholdingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const availableYears = getAvailableTaxYears();
  const defaultYear = availableYears[0] ?? 2026;
  const presets = getScenarioPresets();

  const [taxInput, setTaxInput] = createSignal<TaxFormData>(
    resolveInitialScenario(searchParams as Record<string, string>, defaultYear),
  );

  const [withholdingInputs, setWithholdingInputs] = createSignal<WithholdingInputs>(
    resolveInitialWithholdingInputs(
      searchParams as Record<string, string>,
      deriveWageJobsFromTaxInput(taxInput()),
    ),
  );

  const wageJobs = createMemo(() => deriveWageJobsFromTaxInput(taxInput()));

  const effectiveWithholdingInputs = createMemo(() =>
    resolveWithholdingInputsForWageJobs(wageJobs(), withholdingInputs()),
  );

  const syncScenarioToUrl = () => {
    persistScenarioLocally(taxInput());
    setSearchParams({
      ...searchParams,
      [SCENARIO_QUERY_PARAM]: serializeScenarioInput(taxInput()),
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
    setTaxInput(preset.buildInput(year));
    syncScenarioToUrl();
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
    <main class="mx-auto max-w-6xl space-y-8 px-4 py-8">
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
      <Show when={calculatedConfig() !== null} fallback={<TaxYearInvalid />}>
        <WithholdingResults
          taxInput={taxInput}
          calculatedConfig={calculatedConfig}
          withholdingInputs={effectiveWithholdingInputs}
        />
      </Show>
      <WithholdingSection
        taxInput={taxInput}
        inputs={effectiveWithholdingInputs}
        setInputs={setWithholdingInputs}
        onCommitToUrl={syncWithholdingToUrl}
        onAddWageIncome={rowActions.addSource}
        onLoadSingleW2Preset={applySingleW2Preset}
      />
      <TaxInputForm
        taxInput={taxInput}
        setTaxInput={setTaxInput}
        availableYears={availableYears}
        onCommitToUrl={syncScenarioToUrl}
        defaultOpen={formDefaultOpen()}
      />
    </main>
  );
}
