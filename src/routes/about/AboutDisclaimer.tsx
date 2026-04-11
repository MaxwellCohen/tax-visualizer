import { A } from "@solidjs/router";

export function AboutDisclaimer() {
  return (
    <>
      <section
        class="rounded-xl p-5 text-sm leading-relaxed"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", "box-shadow": "var(--shadow)", color: "var(--text-muted)" }}
      >
        For education only, not tax advice. If you need filing guidance for a real return, consult a
        qualified CPA, enrolled agent, or tax attorney.
      </section>

      <div class="flex items-center gap-4 text-sm" style={{ color: "var(--text-faint)" }}>
        <A
          href="/"
          class="underline underline-offset-2 transition-colors duration-150"
          style={{ color: "var(--accent)" }}
        >
          Home
        </A>
        <span aria-hidden="true">&middot;</span>
        <span>About &amp; methodology</span>
      </div>
    </>
  );
}
