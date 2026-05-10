// fallow-ignore-file code-duplication
import { Show, createMemo, type Accessor, type Setter } from "solid-js";
import { getFilingStatusFromRows } from "~/lib/tax/calc/inputs";
import type { TaxFormData } from "~/lib/tax/form/types";
import { FormCurrencyInput } from "~/components/tax/inputForm/controls/FormCurrencyInput";
import { FormStyledSelect } from "~/components/tax/inputForm/controls/FormStyledSelect";
import { useTaxInputCommitToUrl } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import { createLineItemRowState, patchLineItemRow } from "~/components/tax/inputForm/state/lineItemRowState";
import {
  inputClass,
  itemizedDeductionSelectOptions,
  pretaxFieldCaptionClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/tax/inputForm/shared";
import { FormFieldValidationMessage } from "~/components/tax/inputForm/controls/FormFieldValidationMessage";
import { getInputItemsForSection } from "~/lib/config/taxPage/taxPage.config";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "~/lib/config/taxPage/types";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

const deductionDetailRowTdClass =
  "border-t border-(--border-subtle) px-3 pb-3 pt-2.5 md:border-r-0 md:align-top";

export function ItemizedDeductionSourceRow(props: Props) {
  const commitToUrl = useTaxInputCommitToUrl();
  const filingStatus = createMemo(() => getFilingStatusFromRows(props.taxInput().rows) ?? "single");

  const configItems = createMemo((): ConfigItem[] => {
    const td = props.taxData();
    const fs = filingStatus();
    if (!td) return [];
    return getInputItemsForSection(td, fs, "deduction");
  });

  const kindOptions = createMemo(() => itemizedDeductionSelectOptions("deduction", configItems()));

  const { kind, label, amount, amountError, revalidateAmount, showWhenKey } = createLineItemRowState({
    taxInput: props.taxInput,
    rowId: props.rowId,
    rowType: "deduction",
    taxData: props.taxData,
    validationCtx: props.validationCtx,
  });

  const detail = createMemo(() => {
    const currentKind = kind();
    const items = configItems();
    const item = items.find((it) => it.input?.subcategories?.some((sub) => sub.key === currentKind));

    if (!item) {
      return { description: "Loading...", modelingNote: "Loading..." };
    }
    return {
      description: item.description ?? "Unknown deduction type",
      modelingNote: item.kindDetail?.modelingNote ?? "",
    };
  });

  return (
    <Show when={showWhenKey()} keyed>
      <>
        <tr class={taxInputFormTableTrClass}>
          <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Category">
            <FormStyledSelect
              label="Deduction category"
              hideLabel
              value={() => kind() ?? ""}
              onInput={(e) => {
                const newKind = e.currentTarget.value;
                props.setTaxInput((prev) => ({
                  ...prev,
                  rows: patchLineItemRow(prev.rows, "deduction", props.rowId, { kind: newKind }),
                }));
                revalidateAmount(amount());
              }}
              onBlur={() => {}}
              options={kindOptions()}
            />
          </td>
          <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
            <input
              type="text"
              placeholder="e.g. details, payee"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              aria-label="Label (optional)"
              value={label()}
              onInput={(e) => {
                props.setTaxInput((prev) => ({
                  ...prev,
                  rows: patchLineItemRow(prev.rows, "deduction", props.rowId, { label: e.currentTarget.value }),
                }));
              }}
              onBlur={() => {
                commitToUrl?.();
              }}
            />
          </td>
          <td class={taxInputFormTableTdLabeled} data-label="Amount">
            <div>
              <FormCurrencyInput
                value={amount()}
                onInput={(n) => {
                  props.setTaxInput((prev) => ({
                    ...prev,
                    rows: patchLineItemRow(prev.rows, "deduction", props.rowId, { amount: n }),
                  }));
                  revalidateAmount(n);
                }}
                onBlur={() => {}}
                ariaLabel="Amount"
              />
              <FormFieldValidationMessage message={amountError} />
            </div>
          </td>
          <td class={taxInputFormTableTdActions}>
            <button
              type="button"
              class="rounded-md px-2.5 py-2 text-xs font-medium"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
              disabled={!props.canRemove}
              title={props.canRemove ? "Remove this line" : "Keep at least one line"}
              onClick={() => props.onRemove()}
            >
              Remove
            </button>
          </td>
        </tr>
        <tr class="md:table-row max-md:block max-md:w-full max-md:border-0 max-md:bg-transparent max-md:p-0">
          <td class={deductionDetailRowTdClass} colspan={4}>
            <div class={`${pretaxFieldCaptionClass} space-y-1 text-(--text-muted)`}>
              <p class="leading-snug">{detail().description}</p>
              <p class="leading-snug">{detail().modelingNote}</p>
            </div>
          </td>
        </tr>
      </>
    </Show>
  );
}
