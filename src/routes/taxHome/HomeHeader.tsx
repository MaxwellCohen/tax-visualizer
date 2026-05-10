export function HomeHeader() {
  return (
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground font-heading">
        US Tax Income Visualizer
      </h1>
      <p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Enter your filing details below to see how gross income flows through deductions, pre-tax
        payroll benefits, separate federal treatment of ordinary income (progressive brackets) vs
        long-term capital gains (0% / 15% / 20%), payroll taxes on wages, and take-home pay.
      </p>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Use a preset if you want a fast tour, then change one variable at a time to see what really
        moved the result.
      </p>
    </header>
  );
}
