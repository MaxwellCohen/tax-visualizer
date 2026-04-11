import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import { TaxInputFormOtherIncome } from "~/components/taxInputForm/TaxInputFormOtherIncome";
import { TaxInputFormWagesAccordion } from "~/components/taxInputForm/TaxInputFormWagesAccordion";
import type { TaxInput } from "~/lib/taxCalc";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  values: Accessor<TaxInput>;
  wagesSectionOpen: boolean;
  setWagesSectionOpen: (v: boolean) => void;
  wageSourceIndices: Accessor<number[]>;
  otherSourceIndices: Accessor<number[]>;
  wagesTotal: Accessor<number>;
  addSource: () => void;
  removeSourceAt: (i: number) => void;
};

export function TaxInputFormIncomeSection(props: Props) {
  return (
    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2
          class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
        >
          Income Sources
        </h2>
        <button
          type="button"
          class="rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors"
          style={{
            background: "var(--accent-muted)",
            color: "var(--accent)",
            border: "1px solid var(--border)",
          }}
          onClick={props.addSource}
        >
          Add source
        </button>
      </div>
      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Short-term gains are taxed as ordinary income. Long-term gains use 0% / 15% / 20% rates stacked on
        your ordinary taxable income. Payroll tax applies only to W-2 wages lines.
      </p>
      <div class="space-y-6">
        <TaxInputFormWagesAccordion
          form={props.form}
          values={props.values}
          open={props.wagesSectionOpen}
          onOpenChange={props.setWagesSectionOpen}
          wageSourceIndices={props.wageSourceIndices}
          wagesTotal={props.wagesTotal}
          removeSourceAt={props.removeSourceAt}
        />
        <TaxInputFormOtherIncome
          form={props.form}
          values={props.values}
          otherSourceIndices={props.otherSourceIndices}
          removeSourceAt={props.removeSourceAt}
        />
      </div>
    </section>
  );
}
