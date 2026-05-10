import { createSignal, Show, type JSX } from "solid-js";

const summaryClass =
  "flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden";

const actionClass =
  "shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.12em]";

type AccordionProps = {
  /** Primary summary content (placed in the flexible left region). */
  summary: JSX.Element;
  /** Optional trailing label; if omitted, toggles between Edit / Collapse from internal open state. */
  action?: JSX.Element;
  children: JSX.Element;
  /** Initial open state (accordion manages open/close after mount). */
  defaultOpen?: boolean;
  /** Appended to the default body wrapper classes (`border-t px-3 pb-3 pt-3`). */
  bodyClass?: string;
};

export default function Accordion(props: AccordionProps) {
  const [open, setOpen] = createSignal(props.defaultOpen ?? true);

  return (
    <details
      class="rounded-lg border border-border-subtle bg-surface-alt"
      open={open()}
      onToggle={(e: Event & { currentTarget: HTMLDetailsElement }) => setOpen(e.currentTarget.open)}
    >
      <summary class={`${summaryClass} text-foreground`}>
        <div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
          {props.summary}
        </div>
        <Show
          when={props.action !== undefined}
          fallback={
            <span class={`${actionClass} text-faint-foreground`} aria-hidden>
              {open() ? "Collapse" : "Edit"}
            </span>
          }
        >
          <span class={`${actionClass} text-faint-foreground`} aria-hidden>
            {props.action}
          </span>
        </Show>
      </summary>
      <div
        class={`border-t border-border-subtle px-3 pb-3 pt-3${props.bodyClass ? ` ${props.bodyClass}` : ""}`}
      >
        {props.children}
      </div>
    </details>
  );
}
