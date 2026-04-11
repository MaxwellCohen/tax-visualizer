import { RouteSeo } from "~/components/Seo";
import { AboutDisclaimer } from "~/routes/about/AboutDisclaimer";
import { AboutModelSections } from "~/routes/about/AboutModelSections";
import { AboutProvenanceAndGlossary } from "~/routes/about/AboutProvenanceAndGlossary";

export default function About() {
  return (
    <main class="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <RouteSeo page="about" />
      <header class="space-y-3">
        <h1
          class="text-4xl font-semibold tracking-tight"
          style={{ "font-family": "var(--font-heading)", color: "var(--text)" }}
        >
          About &amp; methodology
        </h1>
        <p class="max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Tax Visualizer is an educational US federal tax explainer built with{" "}
          <a
            href="https://solidjs.com"
            target="_blank"
            rel="noopener noreferrer"
            class="underline underline-offset-2 transition-colors duration-150"
            style={{ color: "var(--accent)" }}
          >
            SolidStart
          </a>
          . It is designed to show why a scenario produces a result, not to replace a real tax
          return or professional advice.
        </p>
      </header>

      <AboutModelSections />
      <AboutProvenanceAndGlossary />
      <AboutDisclaimer />
    </main>
  );
}
