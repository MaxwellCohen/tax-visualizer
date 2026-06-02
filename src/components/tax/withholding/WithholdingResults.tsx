import { Accessor, For, Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import { TaxSummaryMetric } from "~/components/tax/summary/TaxSummaryMetric";
import { computeWithholdingEstimate } from "~/lib/tax/withholding/computeWithholdingEstimate";
import { getFederalIncomeTaxLiability } from "~/lib/tax/withholding/getFederalIncomeTaxLiability";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";
import type { TaxFormData } from "~/lib/tax/form/types";
import type { WithholdingInputs } from "~/lib/tax/withholding/types";
import { deriveWageJobsFromTaxInput } from "~/lib/tax/withholding/wageJobs";
import { getFilingStatusFromRows } from "~/lib/tax/calc/inputs";
import { spouseGroupLabel } from "~/lib/tax/withholding/wageJobs";
import { WithholdingHowItWorks } from "~/components/tax/withholding/WithholdingHowItWorks";

type WithholdingResultsProps = {
  taxInput: Accessor<TaxFormData>;
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
  withholdingInputs: Accessor<WithholdingInputs>;
};

function balanceLabel(balance: number): string {
  if (balance > 0) return "Estimated refund";
  if (balance < 0) return "Estimated amount owed";
  return "Even at year-end";
}

function BalanceMetric(props: { amount: number }) {
  const formatted = () =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(props.amount));

  return (
    <div
      class={`rounded-lg p-4 ${
        props.amount > 0 ? "bg-accent-muted" : "bg-surface-alt"
      }`}
    >
      <p class="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-faint-foreground">
        {balanceLabel(props.amount)}
      </p>
      <p
        class={`mt-1.5 text-xl font-semibold font-heading ${
          props.amount > 0
            ? "text-accent"
            : props.amount < 0
              ? "text-foreground"
              : "text-muted-foreground"
        }`}
      >
        {formatted()}
      </p>
    </div>
  );
}

export function WithholdingResults(props: WithholdingResultsProps) {
  const wageJobs = createMemo(() => deriveWageJobsFromTaxInput(props.taxInput()));
  const filingStatus = createMemo(
    () => getFilingStatusFromRows(props.taxInput().rows) ?? "single",
  );

  const estimate = createMemo(() => {
    const liability = getFederalIncomeTaxLiability(props.calculatedConfig());
    if (liability === null) return undefined;
    return computeWithholdingEstimate(
      liability,
      wageJobs(),
      props.withholdingInputs(),
    );
  });

  return (
    <section class="rounded-xl border border-border bg-surface p-5 shadow-card">
      <CollapsibleBlock title="Withholding estimate" bodyClass="mt-4 space-y-4">
        <Show
          when={estimate()}
          fallback={
            <div class="rounded-lg p-4 text-center text-sm text-faint-foreground">
              Enter a supported tax year and income to see withholding estimates.
            </div>
          }
        >
          {(data) => (
            <>
              <WithholdingHowItWorks />
              <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <TaxSummaryMetric
                  label="Annual federal income tax"
                  value={data().annualFederalLiability}
                  format="currency"
                />
                <Show when={data().annualWithheld !== null}>
                  <TaxSummaryMetric
                    label="Total estimated annual withholding"
                    value={data().annualWithheld!}
                    format="currency"
                  />
                </Show>
                <Show when={data().estimatedBalance !== null}>
                  <BalanceMetric amount={data().estimatedBalance!} />
                </Show>
              </div>

              <Show when={data().jobs.length > 0}>
                <div class="space-y-4">
                  <h3 class="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-faint-foreground">
                    By job
                  </h3>
                  <For each={data().jobs}>
                    {job => (
                      <div class="rounded-lg border border-border bg-surface-alt p-4">
                        <p class="text-sm font-medium text-foreground">
                          {job.label}
                          <Show when={filingStatus() === "marriedJoint"}>
                            <span class="ml-2 text-xs font-normal text-muted-foreground">
                              ({spouseGroupLabel(job.spouseKey, filingStatus())})
                            </span>
                          </Show>
                        </p>
                        <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <TaxSummaryMetric
                            label={`Suggested / paycheck (${job.payPeriodsPerYear}/yr)`}
                            value={job.suggestedPerPaycheck}
                            format="currency"
                            highlight
                          />
                          <Show when={job.annualWithheld !== null}>
                            <TaxSummaryMetric
                              label="Your annual withholding"
                              value={job.annualWithheld!}
                              format="currency"
                            />
                          </Show>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={data().jobs.length === 0}>
                <p class="text-xs leading-relaxed text-muted-foreground">
                  Add W-2 wage lines in the income section to see per-job suggested withholding.
                </p>
              </Show>
              <Show when={data().annualWithheld === null && data().jobs.length > 0}>
                <p class="text-xs leading-relaxed text-muted-foreground">
                  Enter federal tax withheld per paycheck on one or more jobs to see a household
                  refund or amount owed (assuming flat withholding all year).
                </p>
              </Show>
              <Show when={data().estimatedBalance !== null}>
                <p class="text-xs leading-relaxed text-muted-foreground">
                  Household total compares summed job withholding to modeled annual federal income
                  tax. Does not model W-4 stacking, refund timing, or state tax.
                </p>
              </Show>
            </>
          )}
        </Show>
        <p class="text-xs leading-relaxed text-faint-foreground">
          Educational estimate only—not tax or payroll advice. For W-4 or employer withholding, use
          IRS and employer guidance.
        </p>
      </CollapsibleBlock>
    </section>
  );
}
