type MetricProps = { label: string; value: string; highlight?: boolean; format?: "currency" | "percent" | "number" };

function formatValue(value: string, format?: "currency" | "percent" | "number"): string {
  const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return value;

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    case "percent":
      return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num / 100);
    case "number":
    default:
      return new Intl.NumberFormat("en-US").format(num);
  }
}

export function TaxSummaryMetric(props: MetricProps) {
  const formattedValue = () => formatValue(props.value, props.format);
  return (
    <div
      class="rounded-lg p-4"
      style={{
        background: props.highlight ? "var(--accent-muted)" : "var(--surface-alt)",
      }}
    >
      <p
        class="text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--text-faint)" }}
      >
        {props.label}
      </p>
      <p
        class="mt-1.5 text-xl font-semibold"
        style={{
          color: props.highlight ? "var(--accent)" : "var(--text)",
          "font-family": "var(--font-heading)",
        }}
      >
        {formattedValue()}
      </p>
    </div>
  );
}
