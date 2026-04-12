import { Index, Show, createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import Accordion from "~/components/Accordion";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { FederalTaxCreditCaps } from "~/lib/taxData.types";
import { sumLabeledAmountSources } from "~/lib/taxCalc.labeledAmountSource";
import { FederalTaxCreditSourceRow } from "~/components/taxInputForm/FederalTaxCreditSourceFields";
import { money, taxInputFormTableThClass } from "~/components/taxInputForm/shared";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { creditRowIndices } from "~/lib/taxForm.rows";

const addLineBtnClass =
  "shrink-0 whitespace-nowrap rounded-md border border-(--border) bg-(--accent-muted) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--accent) transition-colors";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  addFederalTaxCredit: () => void;
  removeFederalTaxCreditAt: (rowIndex: number) => void;
  clearAll: () => void;
  federalTaxCreditCaps: Accessor<FederalTaxCreditCaps | null>;
};

export function TaxInputFormCreditsSection(props: Props) {
  const calc = createMemo(() => rowsToTaxCalculationInputs(props.values().rows));
  const indices = createMemo(() => creditRowIndices(props.values().rows));
  const creditsTotal = () => sumLabeledAmountSources(calc().federalTaxCredits);

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-(--text-faint) [font-family:var(--font-heading)]">
            Credits
          </h2>
          <span class="text-sm tabular-nums text-(--text-muted)">{money.format(creditsTotal())}</span>
        </>
      }
      bodyClass="space-y-4"
    >
      <p class="text-xs leading-relaxed text-(--text-muted)">
        Choose a credit category per line; optional label for your notes. Amounts sum before applying against
        federal ordinary + long-term + NIIT liability; excess is not refunded. Refundability and phase-outs are
        not modeled per line. Payroll taxes are unchanged.
      </p>
      <div class="flex justify-end md:hidden">
        <button type="button" class={addLineBtnClass} onClick={props.addFederalTaxCredit}>
          Add credit line
        </button>
      </div>
      <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-(--border) bg-(--surface-alt)">
        <table class="w-full min-w-0 border-collapse text-sm md:min-w-xl md:[&>tbody>tr:last-child>td]:border-b-0">
          <thead class="hidden md:table-header-group">
            <tr>
              <th scope="col" class={`${taxInputFormTableThClass} pl-3`}>
                Credit type
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
                  <button type="button" class={addLineBtnClass} onClick={props.addFederalTaxCredit}>
                    Add credit line
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
                  <FederalTaxCreditSourceRow
                    form={props.form}
                    rowIndex={absIndex()}
                    canRemove={indices().length > 1}
                    onRemove={() => props.removeFederalTaxCreditAt(absIndex())}
                    federalTaxCreditCaps={props.federalTaxCreditCaps}
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
