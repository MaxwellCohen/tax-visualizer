export function TaxYearInvalid() {
  return (
    <p
      class="rounded-lg px-4 py-3 text-sm"
      style={{
        background: "var(--warning-bg)",
        border: "1px solid var(--warning-border)",
        color: "var(--warning-text)",
      }}
    >
      Invalid tax year selected.
    </p>
  );
}
