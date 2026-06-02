import type { Accessor, Setter } from "solid-js";
import { FormStyledSelect } from "~/components/tax/inputForm/controls/FormStyledSelect";
import { inputClass, labelClass, parseCurrencyInput } from "~/components/tax/inputForm/shared";
import { PAY_FREQUENCY_OPTIONS, isPayFrequency } from "~/lib/tax/withholding/payFrequency";
import type { WithholdingInputs, WithholdingJobInput } from "~/lib/tax/withholding/types";
import type { WageJob } from "~/lib/tax/withholding/wageJobs";

type WithholdingJobRowProps = {
  job: WageJob;
  input: Accessor<WithholdingJobInput>;
  setInputs: Setter<WithholdingInputs>;
  onCommitToUrl: () => void;
};

export function WithholdingJobRow(props: WithholdingJobRowProps) {
  const withheldValue = () => {
    const v = props.input().federalWithheldPerPaycheck;
    return v === undefined ? "" : String(v);
  };

  const patchJob = (patch: Partial<WithholdingJobInput>) => {
    props.setInputs(prev => ({
      jobs: prev.jobs.map(j =>
        j.incomeRowId === props.job.incomeRowId ? { ...j, ...patch } : j,
      ),
    }));
  };

  return (
    <div class="rounded-lg border border-border bg-surface-alt p-4 space-y-3">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-sm font-medium text-foreground">{props.job.label}</p>
        <p class="text-xs text-muted-foreground">
          W-2 wages{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(props.job.amount)}
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormStyledSelect
          label="Pay frequency"
          value={() => props.input().payFrequency}
          options={PAY_FREQUENCY_OPTIONS}
          onInput={(e) => {
            const value = e.currentTarget.value;
            if (!isPayFrequency(value)) return;
            patchJob({ payFrequency: value });
          }}
          onBlur={props.onCommitToUrl}
        />
        <label class={`${labelClass} text-muted-foreground`}>
          Federal withheld per paycheck (optional)
          <input
            type="number"
            class={`${inputClass} bg-input text-foreground`}
            value={withheldValue()}
            min="0"
            step="1"
            placeholder="e.g. 450"
            onInput={(e) => {
              const raw = e.currentTarget.value;
              if (raw === "") {
                patchJob({ federalWithheldPerPaycheck: undefined });
                return;
              }
              patchJob({ federalWithheldPerPaycheck: parseCurrencyInput(raw) });
            }}
            onBlur={props.onCommitToUrl}
          />
        </label>
      </div>
    </div>
  );
}
