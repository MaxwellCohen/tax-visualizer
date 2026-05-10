export function TaxYearInvalid() {
  return (
    <p
      class="rounded-lg px-4 py-3 text-sm"
      style={{
        background: "var(--color-warning-bg)",
        border: "1px solid var(--color-warning-border)",
        color: "var(--color-warning-text)",
      }}
    >
      Invalid tax year selected.
    </p>
  );
}
