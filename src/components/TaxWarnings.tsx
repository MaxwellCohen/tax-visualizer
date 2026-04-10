type TaxWarningsProps = {
  warnings: string[];
};

export default function TaxWarnings(props: TaxWarningsProps) {
  if (props.warnings.length === 0) return null;

  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--warning-bg)",
        border: "1px solid var(--warning-border)",
      }}
    >
      <h2
        class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--warning-text)", "font-family": "var(--font-heading)" }}
      >
        Check before you compare
      </h2>
      <ul class="space-y-2 text-sm leading-relaxed" style={{ color: "var(--warning-text)" }}>
        {props.warnings.map(warning => (
          <li>{warning}</li>
        ))}
      </ul>
    </section>
  );
}
