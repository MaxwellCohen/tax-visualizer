import { Accessor, For, Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import { TaxSummaryMetric } from "~/components/tax/summary/TaxSummaryMetric";
import {
  buildSummaryFromConfig,
  type SummaryMetric,
} from "~/lib/tax/charts/buildSummary";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";

type TaxSummaryProps = {
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

function MetricItem(props: { metric: SummaryMetric }) {
  return (
    <TaxSummaryMetric
      label={props.metric.label}
      value={props.metric.value}
      format={props.metric.format}
      highlight={props.metric.highlight}
    />
  );
}

export default function TaxSummary(props: TaxSummaryProps) {
  const summaryData = createMemo(() => {
    const calculatedConfig = props.calculatedConfig();
    if (!calculatedConfig) return undefined;
    return buildSummaryFromConfig(calculatedConfig);
  });

  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        "box-shadow": "var(--shadow-card)",
      }}
    >
      <CollapsibleBlock title="Tax Summary" bodyClass="mt-4 space-y-4">
        <p
          class="max-w-3xl text-xs leading-relaxed"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          These cards follow the same configured tax pipeline as the flow and
          Mekko charts: income is reduced by pre-tax and deduction rules, then
          taxes, credits, take-home pay, and rates are surfaced from the page
          config.
        </p>
        <Show
          keyed
          when={summaryData()}
          fallback={
            <div class="rounded-lg p-4 text-center text-sm" style={{ color: "var(--color-faint-foreground)" }}>
              Enter income to see the summary.
            </div>
          }
        >
          {(data) => (
            <div class="space-y-4">
              <For each={data.sections}>
                {(section) => (
                  <div>
                    <h3
                      class="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--color-faint-foreground)" }}
                    >
                      {section.label}
                    </h3>
                    <div class="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                      <For each={section.metrics}>
                        {(metric) => <MetricItem metric={metric} />}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            </div>
          )}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
