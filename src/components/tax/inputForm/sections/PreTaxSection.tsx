// fallow-ignore-file code-duplication
import { For, createMemo, type Accessor, type Setter } from "solid-js";
import Accordion from "~/components/ui/Accordion";
import { PretaxBenefitSourceRow } from "~/components/tax/inputForm/rows/PretaxBenefitSourceRow";
import { AddLineHeaderControls, AddLineMobileControls } from "~/components/tax/inputForm/controls/AddLineControls";
import { taxInputFormTableThClass } from "~/components/tax/inputForm/shared";
import { money } from "~/lib/format/moneyFormat";
import type { TaxFormData, TaxFormPretaxRow } from "~/lib/tax/form/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/tax/data/types";
import type { ValidationContext } from "~/lib/config/types";
import { indexOfTypedRowById, rowIdsForTypedRows } from "~/lib/tax/form/rows";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  preTaxBenefitsTotal: Accessor<number>;
  isMarriedJoint: Accessor<boolean>;
  addPretaxBenefit: () => void;
  removePretaxBenefitAt: (rowIndex: number) => void;
  clearAll: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

export function PreTaxSection(props: Props) {
  const pretaxRowIds = createMemo(() => rowIdsForTypedRows(props.taxInput().rows, "pretax"));
  const pretaxRows = createMemo(() =>
    props.taxInput().rows.filter((r): r is TaxFormPretaxRow => r.type === "pretax"),
  );

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-(--color-faint-foreground) [font-family:var(--font-heading)]">
            Pre-tax benefits
          </h2>
          <span class="text-sm tabular-nums text-(--color-muted-foreground)">
            {money.format(props.preTaxBenefitsTotal())}
          </span>
        </>
      }
      bodyClass="space-y-4"
    >
      <p class="text-xs leading-relaxed text-(--color-muted-foreground)">
        Choose a benefit type and amount per row (optional labels are for your
        notes). Payroll lines apply only to W-2 wages; totals above wages are
        scaled down. IRS contribution limits for the selected year are enforced
        automatically (age-50+ catch-up is not modeled).
      </p>
      <AddLineMobileControls label="Add benefit" onAdd={props.addPretaxBenefit} />
      <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-(--color-border) bg-(--color-surface-alt)">
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
                <AddLineHeaderControls
                  addLabel="Add benefit"
                  onAdd={props.addPretaxBenefit}
                  onClearAll={props.clearAll}
                  showClearAll={pretaxRows().length > 0}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={pretaxRowIds()}>
              {(rowId) => (
                <PretaxBenefitSourceRow
                  taxInput={props.taxInput}
                  setTaxInput={props.setTaxInput}
                  rowId={rowId}
                  canRemove={pretaxRowIds().length > 1}
                  onRemove={() => {
                    const i = indexOfTypedRowById(props.taxInput().rows, "pretax", rowId);
                    if (i >= 0) props.removePretaxBenefitAt(i);
                  }}
                  isMarriedJoint={() => props.isMarriedJoint()}
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
