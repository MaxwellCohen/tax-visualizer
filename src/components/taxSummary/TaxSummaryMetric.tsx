type MetricProps = { label: string; value: string; highlight?: boolean };

export function TaxSummaryMetric(props: MetricProps) {
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
        {props.value}
      </p>
    </div>
  );
}
