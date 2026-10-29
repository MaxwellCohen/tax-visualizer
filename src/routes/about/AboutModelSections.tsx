import { For } from "solid-js";
import type { JSX } from "@solidjs/web";
import { dynamic } from "@solidjs/web";
import { ASSUMPTIONS, MODELED, OMITTED } from "~/routes/about/aboutContent";

function AboutBulletCard(props: { title: string; as?: "section" | "div"; children: JSX.Element }) {
  const Tag = dynamic(() => props.as ?? "section");
  return (
    <Tag class="rounded-xl border border-border bg-surface p-5 shadow-card">
      <h2 class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
        {props.title}
      </h2>
      <ul class="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {props.children}
      </ul>
    </Tag>
  );
}

export function AboutModelSections() {
  return (
    <>
      <AboutBulletCard title="What the app models" as="section">
        <For each={MODELED} keyed={(item) => item}>
          {(item) => <li>{item()}</li>}
        </For>
      </AboutBulletCard>

      <section class="grid gap-4 lg:grid-cols-2">
        <AboutBulletCard title="What it omits" as="div">
          <For each={OMITTED} keyed={(item) => item}>
            {(item) => <li>{item()}</li>}
          </For>
        </AboutBulletCard>

        <AboutBulletCard title="Key assumptions" as="div">
          <For each={ASSUMPTIONS} keyed={(item) => item}>
            {(item) => <li>{item()}</li>}
          </For>
        </AboutBulletCard>
      </section>
    </>
  );
}
