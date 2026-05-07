import { Show } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { type MetricDisplay } from "~/lib/taxVisualization.config";
import { TaxSummaryMetric } from "~/components/taxSummary/TaxSummaryMetric";
import { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import { Accessor, createMemo } from "solid-js";

type TaxSummaryProps = {
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

function MetricItem(props: { metric: MetricDisplay }) {
  const displayValue = () => {
    if (props.metric.category === "credits") {
      const numValue = parseFloat(props.metric.value.replace(/[^0-9.-]/g, ""));
      if (numValue > 0) {
        return "-" + props.metric.value;
      }
    }
    return props.metric.value;
  };

  const parsedValue = parseFloat(props.metric.value.replace(/[^0-9.-]/g, ""));
  
  return (
    <Show when={parsedValue > 0}>
      <TaxSummaryMetric
        label={props.metric.label}
        value={displayValue()}
        highlight={props.metric.highlight}
      />
    </Show>
  );
}

export default function TaxSummary(props: TaxSummaryProps) {
  const metrics = createMemo(() => {
    return props.calculatedConfig()?.map((m) => ({
      metric: {
        id: m.id,
        category: m.summary?.category ?? "income",
        label: m.label,
        value: m.computedValue.toString(),
        format: m.summary?.format ?? "number",
      }
    })) ?? [];
  });

  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <CollapsibleBlock title="Tax Summary" bodyClass="mt-4 space-y-4">
        <div class="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <Show 
            when={() => metrics().length > 0}
            fallback={<div class="col-span-full text-center py-4">No tax data available</div>}
          >
            {metrics().map((item) => (
              <MetricItem metric={item.metric} />
            ))}
          </Show>
        </div>
        {/* <FootnotesDisplay footnotes={footnotes()} /> */}
      </CollapsibleBlock>
    </section>
  );
}
