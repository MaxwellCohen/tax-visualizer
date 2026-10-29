import { For, Show, createSignal, onSettled, type Accessor } from "solid-js";
import { TaxSummaryMetric } from "~/components/tax/summary/TaxSummaryMetric";
import type { HeadlineMetric } from "~/lib/tax/charts/headlineMetrics";

type StickyHeadlineBarProps = {
  metrics: Accessor<HeadlineMetric[]>;
};

export function StickyHeadlineBar(props: StickyHeadlineBarProps) {
  const [pinned, setPinned] = createSignal(false);
  let sentinel: HTMLDivElement | undefined;

  onSettled(() => {
    if (typeof IntersectionObserver === "undefined" || !sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setPinned(!entry.isIntersecting);
      },
      { rootMargin: "-1px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  });

  return (
    <>
      <div ref={(el) => { sentinel = el; }} class="h-px w-full" aria-hidden="true" />
      <Show when={props.metrics().length > 0}>
        <div
          class={[
            "sticky top-0 z-20 -mx-4 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur-sm transition-shadow duration-150",
            { "shadow-card": pinned() },
          ]}
          role="region"
          aria-label="Key results"
        >
          <div class="mx-auto grid max-w-6xl grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            <For each={props.metrics()} keyed={(metric) => metric.label}>
              {(metric) => (
                <div class="min-w-0 sm:min-w-[8.5rem] sm:flex-1">
                  <TaxSummaryMetric
                    label={metric().label}
                    value={metric().value}
                    format={metric().format}
                    highlight={metric().highlight}
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
