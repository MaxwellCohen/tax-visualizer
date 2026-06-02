export function WithholdingHeader() {
  return (
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground font-heading">
        Paycheck withholding estimate
      </h1>
      <p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Enter the same tax scenario as the home visualizer, then set pay frequency and
        withholding per W-2 job (and spouse, when filing jointly). Suggested amounts split
        household tax by each job&apos;s share of wages.
      </p>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        This is a simplified flat spread across pay periods—not a W-4 worksheet, state withholding,
        or payroll FICA schedule.
      </p>
    </header>
  );
}
