import { For, Show, createEffect, createMemo, type Accessor, type Setter } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import { WithholdingJobRow } from "~/components/tax/withholding/WithholdingJobRow";
import { WithholdingNoWageJobs } from "~/components/tax/withholding/WithholdingNoWageJobs";
import { getFilingStatusFromRows } from "~/lib/tax/calc/inputs";
import type { TaxFormData } from "~/lib/tax/form/types";
import type { WithholdingInputs } from "~/lib/tax/withholding/types";
import {
  deriveWageJobsFromTaxInput,
  mergeWithholdingJobsWithWageJobs,
  spouseGroupLabel,
  visibleSpouseGroups,
} from "~/lib/tax/withholding/wageJobs";

type WithholdingSectionProps = {
  taxInput: Accessor<TaxFormData>;
  inputs: Accessor<WithholdingInputs>;
  setInputs: Setter<WithholdingInputs>;
  onCommitToUrl: () => void;
  onAddWageIncome: () => void;
  onLoadSingleW2Preset: () => void;
};

export function WithholdingSection(props: WithholdingSectionProps) {
  const wageJobs = createMemo(() => deriveWageJobsFromTaxInput(props.taxInput()));
  const filingStatus = createMemo(
    () => getFilingStatusFromRows(props.taxInput().rows) ?? "single",
  );

  createEffect(() => {
    const jobs = wageJobs();
    props.setInputs(prev => ({
      jobs: mergeWithholdingJobsWithWageJobs(jobs, prev.jobs),
    }));
  });

  const inputByRowId = createMemo(() => new Map(props.inputs().jobs.map(j => [j.incomeRowId, j])));

  const groups = createMemo(() => {
    const jobs = wageJobs();
    return visibleSpouseGroups(jobs, filingStatus()).map(spouseKey => ({
      spouseKey,
      label: spouseGroupLabel(spouseKey, filingStatus()),
      jobs: jobs.filter(j => j.spouseKey === spouseKey),
    }));
  });

  return (
    <section class="rounded-xl border border-border bg-surface p-5 shadow-card">
      <CollapsibleBlock title="Paycheck settings by job" bodyClass="mt-4 space-y-6">
        <p class="max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Each W-2 wage line in your income section gets its own pay schedule and optional
          federal withholding. Suggested amounts split household tax in proportion to wages on
          that job.
        </p>
        <Show
          when={wageJobs().length > 0}
          fallback={
            <WithholdingNoWageJobs
              onAddWageIncome={props.onAddWageIncome}
              onLoadSingleW2Preset={props.onLoadSingleW2Preset}
            />
          }
        >
          <For each={groups()}>
            {group => (
              <div class="space-y-3">
                <Show when={filingStatus() === "marriedJoint"}>
                  <h3 class="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-faint-foreground">
                    {group.label}
                  </h3>
                </Show>
                <For each={group.jobs}>
                  {job => {
                    const input = () => inputByRowId().get(job.incomeRowId)!;
                    return (
                      <Show when={inputByRowId().has(job.incomeRowId)}>
                        <WithholdingJobRow
                          job={job}
                          input={input}
                          setInputs={props.setInputs}
                          onCommitToUrl={props.onCommitToUrl}
                        />
                      </Show>
                    );
                  }}
                </For>
              </div>
            )}
          </For>
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
