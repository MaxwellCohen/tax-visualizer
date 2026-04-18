import { Show } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { type MetricDisplay } from "~/lib/taxVisualization.config";
import { TaxSummaryMetric } from "~/components/taxSummary/TaxSummaryMetric";
import { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import { Accessor } from "solid-js";

type TaxSummaryProps = {
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

function MetricItem(props: { metric: MetricDisplay }) {
  console.log("MetricItem", JSON.stringify(props.metric, null, 2));
  const displayValue = () => {
    if (props.metric.category === "credits") {
      const numValue = parseFloat(props.metric.value.replace(/[^0-9.-]/g, ""));
      if (numValue > 0) {
        return "-" + props.metric.value;
      }
    }
    return props.metric.value;
  };

  return (
    <Show when={parseFloat(props.metric.value.replace(/[^0-9.-]/g, "")) > 0}>
      <TaxSummaryMetric
        label={props.metric.label}
        value={displayValue()}
        highlight={props.metric.highlight}
      />
    </Show>
  );
}

export default function TaxSummary(props: TaxSummaryProps) {
  console.log("TaxSummary", JSON.stringify(props.calculatedConfig, null, 2));
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
          {props.calculatedConfig()?.map((m) => (
            <MetricItem
              metric={{
                id: m.id,
                category: m.summary?.category ?? "income",
                label: m.label,
                value: m.computedValue.toString(),
              }}
            />
          ))}
        </div>
        {/* <FootnotesDisplay footnotes={footnotes()} /> */}
      </CollapsibleBlock>
    </section>
  );
}
