import { For, Show, createMemo, type Accessor, type Setter } from "solid-js";
import Accordion from "~/components/Accordion";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import type { TaxFormData, TaxFormCreditRow } from "~/lib/taxForm.types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import type { ValidationContext } from "~/lib/config/types";
import { sumLabeledAmountSources } from "~/lib/taxCalc.labeledAmountSource";
import { FederalTaxCreditSourceRow } from "~/components/taxInputForm/FederalTaxCreditSourceFields";
import { money, taxInputFormTableThClass } from "~/components/taxInputForm/shared";
import { indexOfTypedRowById, rowIdsForTypedRows } from "~/lib/taxForm.rows";

const addLineBtnClass =
  "shrink-0 whitespace-nowrap rounded-md border border-(--border) bg-(--accent-muted) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--accent) transition-colors";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  addFederalTaxCredit: () => void;
  removeFederalTaxCreditAt: (rowIndex: number) => void;
  clearAll: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

export function TaxInputFormCreditsSection(props: Props) {
  const calc = createMemo(() => rowsToTaxCalculationInputs(props.taxInput().rows));
  const creditRows = createMemo(() =>
    props.taxInput().rows.filter((r): r is TaxFormCreditRow => r.type === "credit"),
  );
  const creditRowIds = createMemo(() => rowIdsForTypedRows(props.taxInput().rows, "credit"));
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
                  <Show when={creditRows().length > 0}>
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
            <For each={creditRowIds()}>
              {(rowId) => (
                <FederalTaxCreditSourceRow
                  taxInput={props.taxInput}
                  setTaxInput={props.setTaxInput}
                  rowId={rowId}
                  canRemove={creditRowIds().length > 1}
                  onRemove={() => {
                    const i = indexOfTypedRowById(props.taxInput().rows, "credit", rowId);
                    if (i >= 0) props.removeFederalTaxCreditAt(i);
                  }}
                  taxData={props.taxData}
                  filingStatus={props.filingStatus}
                  validationCtx={props.validationCtx}
                />
              )}
            </For>
          </tbody>
        </table>
      </div>
    </Accordion>
  );
}
