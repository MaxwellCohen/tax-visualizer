export function HomeHeader() {
  return (
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground font-heading">
        US Tax Income Visualizer
      </h1>
      <p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Enter income and filing details to see how federal, state, and payroll taxes split take-home pay.
      </p>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Federal and state income tax, without credit phaseouts or local taxes.{" "}
        <a href="/about" class="text-accent underline underline-offset-2">See what we model</a>.
      </p>
    </header>
  );
}
