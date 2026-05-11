import { Show, createMemo, type Accessor, type Setter } from "solid-js";
import Accordion from "~/components/ui/Accordion";
import { rowsToTaxCalculationInputs } from "~/lib/tax/calc/inputs";
import type { TaxFormData, TaxFormDeductionRow, TaxFormRow } from "~/lib/tax/form/types";
import type { TaxYearConfig } from "~/lib/tax/data/types";
import type { ValidationContext } from "~/lib/config/types";
import { sumLabeledAmountSources } from "~/lib/tax/calc/labeledAmountSource";
import { useConfigItemsForSection } from "~/components/tax/inputForm/hooks/useConfigItemsForSection";
import { itemizedDeductionSelectOptions } from "~/components/tax/inputForm/shared";
import { getFilingStatusFromRows } from "~/lib/tax/calc/inputs";
import { useTaxInputCommitToUrl } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import { money } from "~/lib/format/moneyFormat";
import { useStableTypedRowIds } from "~/components/tax/inputForm/hooks/useStableTypedRowIds";
import { settingRowFieldMountKey, settingRowIndex } from "~/lib/tax/form/rows";
import { LineItemsTableBlock } from "~/components/tax/inputForm/sections/LineItemsTableBlock";

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
  const deductionRowIds = useStableTypedRowIds(props.taxInput, "deduction");

  const filingStatus = createMemo(() => getFilingStatusFromRows(props.taxInput().rows) ?? "single");
  const deductionConfigItems = useConfigItemsForSection(props.taxData, filingStatus, "deduction");
  const deductionKindOptions = createMemo(() => itemizedDeductionSelectOptions("deduction", deductionConfigItems()));

  const summaryAmount = () => (useItemized() ? itemizedTotal() : props.standardDeduction());

  const showClearAll = createMemo(() => deductionRows().length > 0);

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
          <LineItemsTableBlock
            description={
              <p class="text-xs leading-relaxed text-muted-foreground">
                Choose a Schedule A–style category per line; optional label for your notes. Amounts sum for the modeled
                itemized total (SALT caps and medical floors are not applied separately).
              </p>
            }
            addLabel="Add line"
            onAdd={props.addItemizedDeduction}
            onClearAll={props.clearAll}
            showClearAll={showClearAll}
            kindColumnHeader="Category"
            labelColumnHeader="Label (optional)"
            amountColumnHeader="Amount"
            rowType="deduction"
            rowIds={deductionRowIds}
            removeAt={props.removeItemizedDeductionAt}
            taxInput={props.taxInput}
            setTaxInput={props.setTaxInput}
            taxData={props.taxData}
            validationCtx={props.validationCtx}
            detailVariant="deduction"
            configItems={deductionConfigItems}
            kindDataLabel="Category"
            kindSelectLabel="Deduction category"
            labelPlaceholder="e.g. details, payee"
            kindOptions={deductionKindOptions}
            removeEntity="line"
          />
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
