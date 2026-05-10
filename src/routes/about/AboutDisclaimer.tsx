import { A } from "@solidjs/router";

export function AboutDisclaimer() {
  return (
    <>
      <section class="rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed text-muted-foreground shadow-card">
        For education only, not tax advice. If you need filing guidance for a real return, consult a
        qualified CPA, enrolled agent, or tax attorney.
      </section>

      <div class="flex items-center gap-4 text-sm text-faint-foreground">
        <A
          href="/"
          class="text-accent underline underline-offset-2 transition-colors duration-150"
        >
          Home
        </A>
        <span aria-hidden="true">&middot;</span>
        <span>About &amp; methodology</span>
      </div>
    </>
  );
}
