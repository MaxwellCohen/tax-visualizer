import { createSignal, Show } from "solid-js";

const SUMMARY =
  "Income flows left to right through deductions, tax buckets, and take-home pay.";

const DETAILS = `Each income row on the left flows into ordinary or long-term taxable income (by source), then follow the flows into pre-tax payroll benefits, deductions, federal tax buckets, taxes, federal credits (when entered — drawn from the highest marginal-rate slice first), separate federal-tax and payroll-tax bars, and a single take-home bar. The "shielded income" path is a visual explanation of income removed by deductions and payroll pre-tax amounts, not a literal cash account. Payroll tax ribbons attach only to ordinary / LTCG ordinary bracket paths (FICA does not apply to long-term gains). Short-term capital gains show as their own income stream on the left, but federal tax on them is included in the ordinary bracket slices.`;

export function SankeyHowToRead() {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="mb-4 max-w-3xl">
      <p class="text-xs leading-relaxed text-muted-foreground">{SUMMARY}</p>
      <button
        type="button"
        class="mt-1 text-xs font-medium text-accent underline underline-offset-2"
        aria-expanded={open()}
        onClick={() => setOpen(v => !v)}
      >
        {open() ? "Hide diagram guide" : "How to read this diagram"}
      </button>
      <Show when={open()}>
        <p class="mt-2 text-xs leading-relaxed text-muted-foreground">{DETAILS}</p>
      </Show>
    </div>
  );
}
