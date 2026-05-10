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
      class="border-t border-border bg-surface"
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
            class="leading-relaxed text-faint-foreground"
            classList={{
              "text-sm": prominent(),
              "text-xs": !prominent(),
            }}
          >
            <span class="font-semibold text-muted-foreground">
              Disclaimer.
            </span>{" "}
            This tool is for{" "}
            <span class="text-muted-foreground">entertainment and educational illustration only</span>.
            It is not tax, legal, or financial advice. Figures are simplified estimates and may not match your
            actual liability.{" "}
            <span class="text-muted-foreground">
              Consult a qualified tax professional
            </span>{" "}
            (such as a CPA or enrolled agent) for guidance specific to your situation.
          </p>
          <p
            class="text-xs text-faint-foreground"
            classList={{
              "text-sm": prominent(),
            }}
          >
            <a
              href="https://github.com/MaxwellCohen/tax-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent underline underline-offset-2 transition-colors duration-150"
            >
              View source on GitHub
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
