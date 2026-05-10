import { For, Show, createMemo, type Accessor, type Setter } from "solid-js";
import Accordion from "~/components/ui/Accordion";
import { rowsToTaxCalculationInputs } from "~/lib/tax/calc/inputs";
import type { TaxFormData, TaxFormDeductionRow, TaxFormRow } from "~/lib/tax/form/types";
import type { TaxYearConfig } from "~/lib/tax/data/types";
import type { ValidationContext } from "~/lib/config/types";
import { sumLabeledAmountSources } from "~/lib/tax/calc/labeledAmountSource";
import { LineItemSourceRow } from "~/components/tax/inputForm/rows/LineItemSourceRow";
import { useConfigItemsForSection } from "~/components/tax/inputForm/hooks/useConfigItemsForSection";
import { itemizedDeductionSelectOptions } from "~/components/tax/inputForm/shared";
import { getFilingStatusFromRows } from "~/lib/tax/calc/inputs";
import { useTaxInputCommitToUrl } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import { AddLineHeaderControls, AddLineMobileControls } from "~/components/tax/inputForm/controls/AddLineControls";
import { taxInputFormTableThClass } from "~/components/tax/inputForm/shared";
import { money } from "~/lib/format/moneyFormat";
import {
  indexOfTypedRowById,
  rowIdsForTypedRows,
  settingRowFieldMountKey,
  settingRowIndex,
} from "~/lib/tax/form/rows";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  standardDeduction: Accessor<number>;
  itemizedBeatsStandard: Accessor<boolean>;
  addItemizedDeduction: () => void;
  removeItemizedDeductionAt: (rowIndex: number) => void;
  clearAll: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

function patchUseItemized(rows: TaxFormRow[], checked: boolean): TaxFormRow[] {
  const i = settingRowIndex(rows, "useItemizedDeductions");
  if (i < 0) return rows;
  const r = rows[i];
  if (r.type !== "setting" || r.id !== "useItemizedDeductions") return rows;
  const next = [...rows];
  next[i] = { ...r, value: checked };
  return next;
}

export function DeductionSection(props: Props) {
  const commitToUrl = useTaxInputCommitToUrl();
  const calc = createMemo(() => rowsToTaxCalculationInputs(props.taxInput().rows));
  const itemizedTotal = () => sumLabeledAmountSources(calc().itemizedDeductions);
  const useItemizedFieldMountKey = createMemo(() =>
    settingRowFieldMountKey(props.taxInput().rows, "useItemizedDeductions"),
  );
  const useItemized = createMemo(() => calc().useItemizedDeductions);
  const deductionRows = createMemo(() =>
    props.taxInput().rows.filter((r): r is TaxFormDeductionRow => r.type === "deduction"),
  );
  const deductionRowIds = createMemo(() => rowIdsForTypedRows(props.taxInput().rows, "deduction"));

  const filingStatus = createMemo(() => getFilingStatusFromRows(props.taxInput().rows) ?? "single");
  const deductionConfigItems = useConfigItemsForSection(props.taxData, filingStatus, "deduction");
  const deductionKindOptions = createMemo(() => itemizedDeductionSelectOptions("deduction", deductionConfigItems()));

  const summaryAmount = () =>
    useItemized() ? itemizedTotal() : props.standardDeduction();

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
            Deductions
          </h2>
          <span class="text-sm tabular-nums text-muted-foreground">{money.format(summaryAmount())}</span>
        </>
      }
      bodyClass="space-y-4"
    >
      <Show when={useItemizedFieldMountKey()} keyed>
        <label class="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={useItemized()}
            onInput={(e) => {
              const checked = e.currentTarget.checked;
              props.setTaxInput((prev) => ({ ...prev, rows: patchUseItemized(prev.rows, checked) }));
            }}
            onBlur={() => {
              commitToUrl?.();
            }}
            class="h-4 w-4 rounded accent-accent"
          />
          Use itemized deductions
        </label>
      </Show>
      <p class="text-xs leading-relaxed text-muted-foreground">
        Standard deduction for this year and filing status: {money.format(props.standardDeduction())}.
      </p>

      <Show when={useItemized()}>
        <>
          <p class="text-xs leading-relaxed text-muted-foreground">
            Choose a Schedule A–style category per line; optional label for your notes. Amounts sum for the modeled
            itemized total (SALT caps and medical floors are not applied separately).
          </p>
          <AddLineMobileControls label="Add line" onAdd={props.addItemizedDeduction} />
          <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-border bg-surface-alt">
            <table class="w-full min-w-0 border-collapse text-sm md:min-w-xl md:[&>tbody>tr:last-child>td]:border-b-0">
              <thead class="hidden md:table-header-group">
                <tr>
                  <th scope="col" class={`${taxInputFormTableThClass} pl-3`}>
                    Category
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
                      addLabel="Add line"
                      onAdd={props.addItemizedDeduction}
                      onClearAll={props.clearAll}
                      showClearAll={deductionRows().length > 0}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={deductionRowIds()}>
                  {(rowId) => (
                    <LineItemSourceRow
                      rowType="deduction"
                      detailVariant="deduction"
                      configItems={deductionConfigItems}
                      taxInput={props.taxInput}
                      setTaxInput={props.setTaxInput}
                      rowId={rowId}
                      canRemove={deductionRowIds().length > 1}
                      onRemove={() => {
                        const i = indexOfTypedRowById(props.taxInput().rows, "deduction", rowId);
                        if (i >= 0) props.removeItemizedDeductionAt(i);
                      }}
                      taxData={props.taxData}
                      validationCtx={props.validationCtx}
                      kindDataLabel="Category"
                      kindSelectLabel="Deduction category"
                      labelPlaceholder="e.g. details, payee"
                      kindOptions={deductionKindOptions}
                      removeEntity="line"
                    />
                  )}
                </For>
              </tbody>
            </table>
          </div>
          <p
            class={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
              props.itemizedBeatsStandard()
                ? "border-border bg-accent-muted text-accent"
                : "border-warning-border bg-warning-bg text-warning-text"
            }`}
          >
            {props.itemizedBeatsStandard()
              ? `Itemized deductions currently exceed the standard deduction by ${money.format(itemizedTotal() - props.standardDeduction())}.`
              : `Itemized deductions are currently ${money.format(props.standardDeduction() - itemizedTotal())} below the standard deduction, so the standard deduction would usually produce a lower federal tax bill.`}
          </p>
        </>
      </Show>
    </Accordion>
  );
}
