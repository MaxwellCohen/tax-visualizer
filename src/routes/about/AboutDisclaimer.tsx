import { DISCLAIMER } from "~/routes/about/aboutContent";

export function AboutDisclaimer() {
  return (
    <>
      <section class="rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed text-muted-foreground shadow-card">
        {DISCLAIMER}
      </section>

      <div class="flex items-center gap-4 text-sm text-faint-foreground">
        <a
          href="/"
          class="text-accent underline underline-offset-2 transition-colors duration-150"
        >
          Home
        </a>
        <span aria-hidden="true">&middot;</span>
        <span>About &amp; methodology</span>
      </div>
    </>
  );
}
