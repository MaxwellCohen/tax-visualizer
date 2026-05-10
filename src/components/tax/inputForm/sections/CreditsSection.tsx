// fallow-ignore-file code-duplication
import { For, createMemo, type Accessor, type Setter } from "solid-js";
import Accordion from "~/components/ui/Accordion";
import { rowsToTaxCalculationInputs } from "~/lib/tax/calc/inputs";
import type { TaxFormData, TaxFormCreditRow } from "~/lib/tax/form/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/tax/data/types";
import type { ValidationContext } from "~/lib/config/types";
import { sumLabeledAmountSources } from "~/lib/tax/calc/labeledAmountSource";
import { FederalTaxCreditSourceRow } from "~/components/tax/inputForm/rows/FederalTaxCreditSourceRow";
import { AddLineHeaderControls, AddLineMobileControls } from "~/components/tax/inputForm/controls/AddLineControls";
import { taxInputFormTableThClass } from "~/components/tax/inputForm/shared";
import { money } from "~/lib/format/moneyFormat";
import { indexOfTypedRowById, rowIdsForTypedRows } from "~/lib/tax/form/rows";
import { childTaxCredit } from "~/lib/config/taxPage/rowMetrics";

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

export function CreditsSection(props: Props) {
  const calc = createMemo(() => rowsToTaxCalculationInputs(props.taxInput().rows));
  const creditRows = createMemo(() =>
    props.taxInput().rows.filter((r): r is TaxFormCreditRow => r.type === "credit"),
  );
  const creditRowIds = createMemo(() => rowIdsForTypedRows(props.taxInput().rows, "credit"));
  const creditsTotal = () => {
    const taxData = props.taxData();
    const dependentCredits = taxData ? childTaxCredit(props.taxInput().rows, taxData) : 0;
    return dependentCredits + sumLabeledAmountSources(calc().federalTaxCredits);
  };

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-(--color-faint-foreground) [font-family:var(--font-heading)]">
            Credits
          </h2>
          <span class="text-sm tabular-nums text-(--color-muted-foreground)">{money.format(creditsTotal())}</span>
        </>
      }
      bodyClass="space-y-4"
    >
      <p class="text-xs leading-relaxed text-(--color-muted-foreground)">
        Dependent credits are calculated from the counts in Settings. Add other federal credits here by category;
        excess is not refunded, and payroll taxes are unchanged.
      </p>
      <AddLineMobileControls label="Add credit line" onAdd={props.addFederalTaxCredit} />
      <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-(--color-border) bg-(--color-surface-alt)">
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
                <AddLineHeaderControls
                  addLabel="Add credit line"
                  onAdd={props.addFederalTaxCredit}
                  onClearAll={props.clearAll}
                  showClearAll={creditRows().length > 0}
                />
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
