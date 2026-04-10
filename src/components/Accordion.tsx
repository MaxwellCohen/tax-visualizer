import { Show, type JSX } from "solid-js";

const shellStyle: JSX.CSSProperties = {
  background: "var(--surface-alt)",
  border: "1px solid var(--border-subtle)",
};

const summaryClass =
  "flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] [&::-webkit-details-marker]:hidden";

const actionClass =
  "shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.12em]";

export type AccordionProps = {
  /** Primary summary content (placed in the flexible left region). */
  summary: JSX.Element;
  /** Optional trailing label (for example Edit / Collapse). */
  action?: JSX.Element;
  children: JSX.Element;
  /**
   * When `open` is provided, the accordion is controlled and `onOpenChange` should be used
   * to sync state. When omitted, native `<details>` toggle behavior is used (starts closed).
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Appended to the default body wrapper classes (`border-t px-3 pb-3 pt-3`). */
  bodyClass?: string;
};

function detailsBindings(props: AccordionProps) {
  if (props.open === undefined) {
    return {} as Record<string, unknown>;
  }
  return {
    open: props.open,
    onToggle: (e: Event & { currentTarget: HTMLDetailsElement }) =>
      props.onOpenChange?.(e.currentTarget.open),
  };
}

export default function Accordion(props: AccordionProps) {
  return (
    <details class="rounded-lg" style={shellStyle} {...detailsBindings(props)}>
      <summary class={summaryClass} style={{ color: "var(--text)" }}>
        <div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
          {props.summary}
        </div>
        <Show when={props.action !== undefined}>
          <span class={actionClass} style={{ color: "var(--text-faint)" }} aria-hidden>
            {props.action}
          </span>
        </Show>
      </summary>
      <div
        class={`border-t px-3 pb-3 pt-3${props.bodyClass ? ` ${props.bodyClass}` : ""}`}
        style={{ "border-color": "var(--border-subtle)" }}
      >
        {props.children}
      </div>
    </details>
  );
}
