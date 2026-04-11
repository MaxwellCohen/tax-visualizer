type TaxDisclaimerProps = {
  /** Larger text and padding for emphasis (e.g. if reused in a dedicated section). */
  prominent?: boolean;
};

export default function TaxDisclaimer(props: TaxDisclaimerProps) {
  const prominent = () => !!props.prominent;

  return (
    <aside
      role="note"
      aria-label="Disclaimer"
      class="border-t border-(--border)"
      style={{ background: "var(--surface)" }}
    >
      <div
        class="mx-auto max-w-6xl px-4"
        classList={{
          "py-6": prominent(),
          "py-4": !prominent(),
        }}
      >
        <p
          class="leading-relaxed"
          classList={{
            "text-sm": prominent(),
            "text-xs": !prominent(),
          }}
          style={{ color: "var(--text-faint)" }}
        >
          <span class="font-semibold" style={{ color: "var(--text-muted)" }}>
            Disclaimer.
          </span>{" "}
          This tool is for{" "}
          <span style={{ color: "var(--text-muted)" }}>entertainment and educational illustration only</span>.
          It is not tax, legal, or financial advice. Figures are simplified estimates and may not match your
          actual liability.{" "}
          <span style={{ color: "var(--text-muted)" }}>
            Consult a qualified tax professional
          </span>{" "}
          (such as a CPA or enrolled agent) for guidance specific to your situation.
        </p>
      </div>
    </aside>
  );
}
