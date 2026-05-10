import type { SummaryMetricFormat } from "~/lib/tax/charts/buildSummary";

type MetricProps = {
  label: string;
  value: number;
  highlight?: boolean;
  format?: SummaryMetricFormat;
};

function formatValue(value: number, format?: SummaryMetricFormat): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    case "percent":
      return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
    case "number":
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}

export function TaxSummaryMetric(props: MetricProps) {
  const formattedValue = () => formatValue(props.value, props.format);
  return (
    <div
      class={`rounded-lg p-4 ${props.highlight ? "bg-accent-muted" : "bg-surface-alt"}`}
    >
      <p class="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-faint-foreground">
        {props.label}
      </p>
      <p
        class={`mt-1.5 text-xl font-semibold font-heading ${
          props.highlight ? "text-accent" : "text-foreground"
        }`}
      >
        {formattedValue()}
      </p>
    </div>
  );
}
