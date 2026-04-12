import { Index, Show, createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import Accordion from "~/components/Accordion";
import { PretaxBenefitSourceRow } from "~/components/taxInputForm/PretaxBenefitSourceFields";
import {
  money,
  pretaxFieldCaptionClass,
  taxInputFormTableThClass,
} from "~/components/taxInputForm/shared";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { pretaxRowIndices } from "~/lib/taxForm.rows";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  preTaxBenefitsTotal: Accessor<number>;
  isMarriedJoint: Accessor<boolean>;
  addPretaxBenefit: () => void;
  removePretaxBenefitAt: (rowIndex: number) => void;
  clearAll: () => void;
  pretaxLimits: Accessor<PretaxBenefitLimits | null>;
};

const addBenefitBtnClass =
  "shrink-0 whitespace-nowrap rounded-md border border-(--border) bg-(--accent-muted) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--accent) transition-colors";

export function TaxInputFormPreTaxSection(props: Props) {
  const indices = createMemo(() => pretaxRowIndices(props.values().rows));

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-(--text-faint) [font-family:var(--font-heading)]">
            Pre-tax benefits
          </h2>
          <span class="text-sm tabular-nums text-(--text-muted)">
            {money.format(props.preTaxBenefitsTotal())}
          </span>
        </>
      }
      bodyClass="space-y-4"
    >
      <p class="text-xs leading-relaxed text-(--text-muted)">
        Choose a benefit type and amount per row (optional labels are for your
        notes). Payroll lines apply only to W-2 wages; totals above wages are
        scaled down. IRS contribution limits for the selected year are enforced
        automatically (age-50+ catch-up is not modeled).
      </p>
      <div class="flex justify-end md:hidden">
        <button
          type="button"
          class={addBenefitBtnClass}
          onClick={props.addPretaxBenefit}
        >
          Add benefit
        </button>
      </div>
      <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-(--border) bg-(--surface-alt)">
        <table class="w-full min-w-0 border-collapse text-sm md:min-w-xl md:[&>tbody>tr:last-child>td]:border-b-0">
          <thead class="hidden md:table-header-group">
            <tr>
              <th scope="col" class={`${taxInputFormTableThClass} pl-3`}>
                Type
              </th>
              <th scope="col" class={taxInputFormTableThClass}>
                Label (optional)
              </th>
              <th scope="col" class={taxInputFormTableThClass}>
                Amount
              </th>
              <th
                scope="col"
                class={`${taxInputFormTableThClass} whitespace-nowrap pr-3 text-right align-bottom`}
              >
                <div class="flex justify-end gap-2">
                  <Show when={indices().length > 0}>
                    <button
                      type="button"
                      class="shrink-0 whitespace-nowrap rounded-md border border-(--border) bg-(--surface-alt) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--text-muted) transition-colors hover:border-(--warning-text) hover:text-(--warning-text)"
                      onClick={props.clearAll}
                    >
                      Remove all
                    </button>
                  </Show>
                  <button
                    type="button"
                    class={addBenefitBtnClass}
                    onClick={props.addPretaxBenefit}
                  >
                    Add benefit
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <Index each={indices()}>
              {(_src, idx) => {
                const rowIndex = () =>
                  typeof idx === "function" ? (idx as () => number)() : (idx as number);
                const absIndex = () => indices()[rowIndex()];
                return (
                  <PretaxBenefitSourceRow
                    form={props.form}
                    rowIndex={absIndex()}
                    canRemove={indices().length > 1}
                    onRemove={() => props.removePretaxBenefitAt(absIndex())}
                    isMarriedJoint={() => props.isMarriedJoint()}
                    pretaxLimits={props.pretaxLimits}
                  />
                );
              }}
            </Index>
          </tbody>
        </table>
      </div>

    </Accordion>
  );
}
