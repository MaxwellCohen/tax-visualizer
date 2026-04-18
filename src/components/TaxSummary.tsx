import { Show } from "solid-js";
import type { TaxResult } from "~/lib/taxForm.types";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { computeMetrics, computeFootnotes, type MetricDisplay, type FootnoteDisplay } from "~/lib/taxVisualization.config";
import { TaxSummaryMetric } from "~/components/taxSummary/TaxSummaryMetric";

type TaxSummaryProps = {
  result: TaxResult;
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


function FootnotesDisplay(props: { footnotes: FootnoteDisplay[] }) {
  if (props.footnotes.length === 0) return null;
  
  return (
    <>
      <div class="space-y-1.5 text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
        {props.footnotes.filter(f => ["effective-rate-formula", "take-home-formula"].includes(f.id)).map((f) => (
          <p>
            {f.id === "effective-rate-formula" ? "Effective tax rate = " : "Take-home pay = "}
            <code>{f.text}</code>.
          </p>
        ))}
      </div>
      <p class="text-xs" style={{ color: "var(--text-faint)" }}>
        {props.footnotes.filter(f => ["pretax-breakdown", "federal-tax-breakdown", "taxable-income-breakdown", "payroll-breakdown"].includes(f.id)).map((f, i) => (
          <>
            {i > 0 && <br />}
            {f.text}
          </>
        ))}
      </p>
    </>
  );
}

export default function TaxSummary(props: TaxSummaryProps) {
  const metrics = () => computeMetrics(props.result);
  const footnotes = () => computeFootnotes(props.result);
  
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
          {metrics().map((m) => (
            <MetricItem metric={m} />
          ))}
        </div>
        <FootnotesDisplay footnotes={footnotes()} />
      </CollapsibleBlock>
    </section>
  );
}