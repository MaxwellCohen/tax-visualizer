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
      class="border-t border-(--color-border)"
      style={{ background: "var(--color-surface)" }}
    >
      <div
        class="mx-auto max-w-6xl px-4"
        classList={{
          "py-6": prominent(),
          "py-4": !prominent(),
        }}
      >
        <div
          classList={{
            "space-y-2": !prominent(),
            "space-y-3": prominent(),
          }}
        >
          <p
            class="leading-relaxed"
            classList={{
              "text-sm": prominent(),
              "text-xs": !prominent(),
            }}
            style={{ color: "var(--color-faint-foreground)" }}
          >
            <span class="font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
              Disclaimer.
            </span>{" "}
            This tool is for{" "}
            <span style={{ color: "var(--color-muted-foreground)" }}>entertainment and educational illustration only</span>.
            It is not tax, legal, or financial advice. Figures are simplified estimates and may not match your
            actual liability.{" "}
            <span style={{ color: "var(--color-muted-foreground)" }}>
              Consult a qualified tax professional
            </span>{" "}
            (such as a CPA or enrolled agent) for guidance specific to your situation.
          </p>
          <p
            class="text-xs"
            classList={{
              "text-sm": prominent(),
            }}
            style={{ color: "var(--color-faint-foreground)" }}
          >
            <a
              href="https://github.com/MaxwellCohen/tax-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-2 transition-colors duration-150"
              style={{ color: "var(--color-accent)" }}
            >
              View source on GitHub
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
