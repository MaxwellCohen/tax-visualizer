import { A } from "@solidjs/router";

export function AboutDisclaimer() {
  return (
    <>
      <section
        class="rounded-xl p-5 text-sm leading-relaxed"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", "box-shadow": "var(--shadow-card)", color: "var(--color-muted-foreground)" }}
      >
        For education only, not tax advice. If you need filing guidance for a real return, consult a
        qualified CPA, enrolled agent, or tax attorney.
      </section>

      <div class="flex items-center gap-4 text-sm" style={{ color: "var(--color-faint-foreground)" }}>
        <A
          href="/"
          class="underline underline-offset-2 transition-colors duration-150"
          style={{ color: "var(--color-accent)" }}
        >
          Home
        </A>
        <span aria-hidden="true">&middot;</span>
        <span>About &amp; methodology</span>
      </div>
    </>
  );
}
