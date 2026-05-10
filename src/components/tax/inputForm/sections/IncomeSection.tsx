// fallow-ignore-file code-duplication
import { For, createMemo, type Accessor, type Setter } from "solid-js";
import Accordion from "~/components/ui/Accordion";
import { IncomeSourceTableRow } from "~/components/tax/inputForm/rows/IncomeSourceTableRow";
import { AddLineHeaderControls, AddLineMobileControls } from "~/components/tax/inputForm/controls/AddLineControls";
import { taxInputFormTableThClass } from "~/components/tax/inputForm/shared";
import { money } from "~/lib/format/moneyFormat";
import type { TaxFormData, TaxFormIncomeRow } from "~/lib/tax/form/types";
import { indexOfTypedRowById, rowIdsForTypedRows } from "~/lib/tax/form/rows";
import type { TaxYearConfig, FilingStatus } from "~/lib/tax/data/types";
import type { ValidationContext } from "~/lib/config/types";
import { getInputItemsForSection } from "~/lib/config/taxPage/taxPage.config";
import type { ConfigItem } from "~/lib/config/taxPage/types";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  addSource: () => void;
  removeSourceAt: (i: number) => void;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

export function IncomeSection(props: Props) {
  const incomeRowIds = createMemo(() => rowIdsForTypedRows(props.taxInput().rows, "income"));

  const incomeTotal = createMemo(() =>
    props
      .taxInput()
      .rows.filter((r): r is TaxFormIncomeRow => r.type === "income")
      .reduce((sum, s) => {
        const n = s.amount;
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
  );

  const configItems = createMemo((): ConfigItem[] => {
    const td = props.taxData();
    const fs = props.filingStatus();
    if (!td) return [];
    return getInputItemsForSection(td, fs, "income");
  });

  const isMarriedJoint = createMemo(() => props.filingStatus() === "marriedJoint");

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
            Income sources
          </h2>
          <span class="text-sm tabular-nums text-muted-foreground">{money.format(incomeTotal())}</span>
        </>
      }
      bodyClass="space-y-4"
    >
      <p class="text-xs leading-relaxed text-muted-foreground">
        Add wages, self-employment, and other ordinary income—one row per type. Optional labels are only for your
        notes (for example in charts).
      </p>
      <AddLineMobileControls label="Add source" onAdd={props.addSource} />
      <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-border bg-surface-alt">
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
              <th scope="col" class={`${taxInputFormTableThClass} whitespace-nowrap pr-3 text-right align-bottom`}>
                <AddLineHeaderControls addLabel="Add source" onAdd={props.addSource} />
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={incomeRowIds()}>
              {(rowId) => (
                <IncomeSourceTableRow
                  taxInput={props.taxInput}
                  setTaxInput={props.setTaxInput}
                  rowId={rowId}
                  canRemove={incomeRowIds().length > 1}
                  onRemove={() => {
                    const i = indexOfTypedRowById(props.taxInput().rows, "income", rowId);
                    if (i >= 0) props.removeSourceAt(i);
                  }}
                  configItems={configItems()}
                  isMarriedJoint={isMarriedJoint()}
                  taxData={props.taxData}
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
