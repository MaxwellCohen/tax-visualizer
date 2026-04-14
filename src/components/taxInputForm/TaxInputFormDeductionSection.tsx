import { For, Show, createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import Accordion from "~/components/Accordion";
import { rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import type { TaxFormData, TaxFormDeductionRow } from "~/lib/taxForm.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { sumLabeledAmountSources } from "~/lib/taxCalc.labeledAmountSource";
import { ItemizedDeductionSourceRow } from "~/components/taxInputForm/ItemizedDeductionSourceFields";
import { money, taxInputFormTableThClass } from "~/components/taxInputForm/shared";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import {
  indexOfTypedRowById,
  rowIdsForTypedRows,
  settingRowFieldMountKey,
  settingRowIndex,
} from "~/lib/taxForm.rows";

const addLineBtnClass =
  "shrink-0 whitespace-nowrap rounded-md border border-(--border) bg-(--accent-muted) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--accent) transition-colors";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  standardDeduction: Accessor<number>;
  itemizedBeatsStandard: Accessor<boolean>;
  addItemizedDeduction: () => void;
  removeItemizedDeductionAt: (rowIndex: number) => void;
  clearAll: () => void;
  taxData: Accessor<TaxYearConfig | null>;
};

export function TaxInputFormDeductionSection(props: Props) {
  const calc = createMemo(() => rowsToTaxCalculationInputs(props.values().rows));
  const itemizedTotal = () => sumLabeledAmountSources(calc().itemizedDeductions);
  const useItemizedIdx = createMemo(() => settingRowIndex(props.values().rows, "useItemizedDeductions"));
  const useItemizedFieldMountKey = createMemo(() =>
    settingRowFieldMountKey(props.values().rows, "useItemizedDeductions"),
  );
  const useItemized = createMemo(() => calc().useItemizedDeductions);
  const deductionRows = createMemo(() =>
    props.values().rows.filter((r): r is TaxFormDeductionRow => r.type === "deduction"),
  );
  const deductionRowIds = createMemo(() => rowIdsForTypedRows(props.values().rows, "deduction"));

  const summaryAmount = () =>
    useItemized() ? itemizedTotal() : props.standardDeduction();

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-(--text-faint) [font-family:var(--font-heading)]">
            Deductions
          </h2>
          <span class="text-sm tabular-nums text-(--text-muted)">{money.format(summaryAmount())}</span>
        </>
      }
      bodyClass="space-y-4"
    >
      <Show when={useItemizedFieldMountKey()} keyed>
        <props.form.Field name={`rows[${useItemizedIdx()}].value`}>
          {(field: any) => (
            <label
              class="flex items-center gap-2.5 text-sm cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              <input
                type="checkbox"
                checked={field().state.value as boolean}
                onChange={e => field().handleChange(e.currentTarget.checked)}
                onBlur={field().handleBlur}
                class="h-4 w-4 rounded"
                style={{ "accent-color": "var(--accent)" }}
              />
              Use itemized deductions
            </label>
          )}
        </props.form.Field>
      </Show>
      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Standard deduction for this year and filing status: {money.format(props.standardDeduction())}.
      </p>

      <Show when={useItemized()}>
        <>
          <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Choose a Schedule A–style category per line; optional label for your notes. Amounts sum for the modeled
            itemized total (SALT caps and medical floors are not applied separately).
          </p>
          <div class="flex justify-end md:hidden">
            <button type="button" class={addLineBtnClass} onClick={props.addItemizedDeduction}>
              Add line
            </button>
          </div>
          <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-(--border) bg-(--surface-alt)">
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
                    <div class="flex justify-end gap-2">
                      <Show when={deductionRows().length > 0}>
                        <button
                          type="button"
                          class="shrink-0 whitespace-nowrap rounded-md border border-(--border) bg-(--surface-alt) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--text-muted) transition-colors hover:border-(--warning-text) hover:text-(--warning-text)"
                          onClick={props.clearAll}
                        >
                          Remove all
                        </button>
                      </Show>
                      <button type="button" class={addLineBtnClass} onClick={props.addItemizedDeduction}>
                        Add line
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={deductionRowIds()}>
                  {(rowId) => (
                    <ItemizedDeductionSourceRow
                      form={props.form}
                      values={props.values}
                      rowId={rowId}
                      canRemove={deductionRowIds().length > 1}
                      onRemove={() => {
                        const i = indexOfTypedRowById(props.values().rows, "deduction", rowId);
                        if (i >= 0) props.removeItemizedDeductionAt(i);
                      }}
                      taxData={props.taxData}
                    />
                  )}
                </For>
              </tbody>
            </table>
          </div>
          <p
            class="rounded-lg px-3 py-2 text-xs leading-relaxed"
            style={{
              background: props.itemizedBeatsStandard() ? "var(--accent-muted)" : "var(--warning-bg)",
              color: props.itemizedBeatsStandard() ? "var(--accent)" : "var(--warning-text)",
              border: `1px solid ${props.itemizedBeatsStandard() ? "var(--border)" : "var(--warning-border)"}`,
            }}
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
