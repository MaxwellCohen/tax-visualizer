import { For } from "solid-js";
import { GLOSSARY, PROVENANCE } from "~/routes/about/aboutContent";

export function AboutProvenanceAndGlossary() {
  return (
    <>
      <section class="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
          Data provenance
        </h2>
        <p class="text-sm leading-relaxed text-muted-foreground">{PROVENANCE}</p>
      </section>

      <section class="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
          Glossary
        </h2>
        <dl class="grid gap-4 md:grid-cols-2">
          <For each={GLOSSARY} keyed={(entry) => entry.term}>
            {(entry) => (
              <div>
                <dt class="text-sm font-semibold text-foreground">{entry().term}</dt>
                <dd class="text-sm leading-relaxed text-muted-foreground">{entry().definition}</dd>
              </div>
            )}
          </For>
        </dl>
      </section>
    </>
  );
}
