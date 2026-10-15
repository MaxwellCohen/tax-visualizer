export function HomeHeader() {
  return (
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground font-heading">
        US Tax Income Visualizer
      </h1>
      <p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Enter income and filing details to see how federal tax and payroll tax split take-home pay.
      </p>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Federal only — no state tax and no credit phaseouts.{" "}
        <a href="/about" class="text-accent underline underline-offset-2">See what we model</a>.
      </p>
    </header>
  );
}
