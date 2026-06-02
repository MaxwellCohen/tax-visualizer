import { createSignal, Show } from "solid-js";

export function WithholdingHowItWorks() {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="rounded-lg border border-border-subtle bg-surface-alt p-3">
      <p class="text-xs leading-relaxed text-muted-foreground">
        Suggested per-paycheck amounts split annual federal income tax across your W-2 jobs by
        wage share, then divide by pay periods. Not a W-4 worksheet.
      </p>
      <button
        type="button"
        class="mt-2 text-xs font-medium text-accent underline underline-offset-2"
        aria-expanded={open()}
        onClick={() => setOpen(v => !v)}
      >
        {open() ? "Hide calculation details" : "How this is calculated"}
      </button>
      <Show when={open()}>
        <ul class="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
          <li>
            Annual federal tax comes from the same modeled liability as the home visualizer
            (post-credit net).
          </li>
          <li>Each job&apos;s share = (job wages ÷ total wages) × annual federal tax.</li>
          <li>Suggested per paycheck = job share ÷ pay periods per year (52 / 26 / 24 / 12).</li>
          <li>
            Refund or owed compares your entered withholding × pay periods to annual federal tax.
          </li>
        </ul>
      </Show>
    </div>
  );
}
