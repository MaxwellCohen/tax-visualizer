type WithholdingNoWageJobsProps = {
  onAddWageIncome: () => void;
  onLoadSingleW2Preset: () => void;
};

export function WithholdingNoWageJobs(props: WithholdingNoWageJobsProps) {
  return (
    <div class="space-y-4 rounded-lg border border-dashed border-border bg-surface-alt p-4">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Paycheck withholding estimates need at least one{" "}
        <span class="text-foreground">W-2 wage</span> income line. Capital gains, 1099, and other
        non-wage income are not split into per-job paycheck suggestions.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-md border border-border bg-accent-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-accent transition-colors"
          onClick={props.onAddWageIncome}
        >
          Add salary (W-2)
        </button>
        <button
          type="button"
          class="rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          onClick={props.onLoadSingleW2Preset}
        >
          Load Single W-2 preset
        </button>
      </div>
    </div>
  );
}
