import { createSignal, Show } from "solid-js";

const SUMMARY =
  "Left to right: income, then amounts removed by pretax and deductions, then tax, then take-home. Click a bar for its label and dollars.";

const DETAILS = `1. Left: gross income by type. 2. Middle: pretax payroll amounts and the standard or itemized deduction reduce what is taxed. 3. Right: federal income tax, payroll tax, and take-home. Credits come off the highest tax slice first. “Income removed by deductions” is a teaching view, not a bank account. Payroll tax does not apply to long-term gains. Short-term gains are taxed in the ordinary brackets.`;

export function SankeyHowToRead() {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="mb-4 max-w-3xl">
      <p class="text-xs leading-relaxed text-muted-foreground">{SUMMARY}</p>
      <button
        type="button"
        class="mt-1 text-xs font-medium text-accent underline underline-offset-2"
        aria-expanded={open() ? "true" : "false"}
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
