import { createSignal, createUniqueId, Show, type JSX } from "solid-js";

type CollapsibleBlockProps = {
  title: string;
  defaultOpen?: boolean;
  headerAside?: JSX.Element;
  children: JSX.Element;
  /** Classes on the collapsible panel wrapper (default `mt-4`) */
  bodyClass?: string;
};

export function CollapsibleBlock(props: CollapsibleBlockProps) {
  const [open, setOpen] = createSignal(props.defaultOpen ?? true);
  const titleId = createUniqueId();
  const panelId = createUniqueId();

  return (
    <>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-(--border) bg-(--surface-alt) text-(--text-muted) transition-[color,background-color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          aria-expanded={open()}
          aria-controls={panelId}
          aria-label={`${open() ? "Collapse" : "Expand"} ${props.title} section`}
          onClick={() => setOpen(v => !v)}
        >
          <svg
            class="block h-4 w-4 shrink-0 transition-transform duration-200"
            classList={{ "rotate-180": open() }}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <div class="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
          <h2
            id={titleId}
            class="text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
          >
            {props.title}
          </h2>
          {props.headerAside}
        </div>
      </div>
      <Show when={open()}>
        <div
          id={panelId}
          role="region"
          aria-labelledby={titleId}
          class={props.bodyClass ?? "mt-4"}
        >
          {props.children}
        </div>
      </Show>
    </>
  );
}
