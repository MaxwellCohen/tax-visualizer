import { For, Show, createSignal, onCleanup, onMount, type Accessor } from "solid-js";
import { TaxSummaryMetric } from "~/components/tax/summary/TaxSummaryMetric";
import type { HeadlineMetric } from "~/lib/tax/charts/headlineMetrics";

type StickyHeadlineBarProps = {
  metrics: Accessor<HeadlineMetric[]>;
};

export function StickyHeadlineBar(props: StickyHeadlineBarProps) {
  const [pinned, setPinned] = createSignal(false);
  let sentinel: HTMLDivElement | undefined;

  onMount(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setPinned(!entry.isIntersecting);
      },
      { rootMargin: "-1px 0px 0px 0px", threshold: 0 },
    );
    if (sentinel) observer.observe(sentinel);
    onCleanup(() => observer.disconnect());
  });

  return (
    <>
      <div ref={sentinel} class="h-px w-full" aria-hidden="true" />
      <Show when={props.metrics().length > 0}>
        <div
          class="sticky top-0 z-20 -mx-4 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur-sm transition-shadow duration-150"
          classList={{ "shadow-card": pinned() }}
          role="region"
          aria-label="Key results"
        >
          <div class="mx-auto flex max-w-6xl flex-wrap gap-2">
            <For each={props.metrics()}>
              {metric => (
                <div class="min-w-[8.5rem] flex-1">
                  <TaxSummaryMetric
                    label={metric.label}
                    value={metric.value}
                    format={metric.format}
                    highlight={metric.highlight}
                  />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  );
}
