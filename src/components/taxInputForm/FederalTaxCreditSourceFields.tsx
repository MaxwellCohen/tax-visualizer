
import { Show, createMemo, type Accessor, type Setter } from "solid-js";
import type { TaxFormData } from "~/lib/taxForm.types";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import { useTaxInputCommitToUrl } from "~/components/taxInputForm/taxInputFormCommitUrlContext";
import { createLineItemRowState, patchLineItemRow } from "~/components/taxInputForm/lineItemRowState";
import {
  itemizedDeductionSelectOptions,
  inputClass,
  pretaxFieldCaptionClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import { FormFieldValidationMessage } from "~/components/taxInputForm/FormFieldValidationMessage";
import { getInputItemsForSection } from "~/lib/config/page/Page.config";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import type { ConfigItem } from "~/lib/config/page/pageConfig.types";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

const creditDetailRowTdClass =
  "border-t border-(--border-subtle) px-3 pb-3 pt-2.5 md:border-r-0 md:align-top";

export function FederalTaxCreditSourceRow(props: Props) {
  const commitToUrl = useTaxInputCommitToUrl();
  const configItems = createMemo((): ConfigItem[] => {
    const td = props.taxData();
    const fs = props.filingStatus();
    if (!td) return [];
    return getInputItemsForSection(td, fs, "credit");
  });

  const kindOptions = createMemo(() => itemizedDeductionSelectOptions("credit", configItems()));

  const { kind, label, amount, amountError, revalidateAmount, showWhenKey } = createLineItemRowState({
    taxInput: props.taxInput,
    rowId: props.rowId,
    rowType: "credit",
    taxData: props.taxData,
    validationCtx: props.validationCtx,
  });

  const detail = createMemo(() => {
    const currentKind = kind();
    const items = configItems();
    const item =
      items.find((it) => it.input?.subcategories?.some((sub) => sub.key === currentKind)) ??
      items.find((i) => i.input?.category === "credit");

    if (!item) {
      return { description: "Loading...", modelingNote: "Loading..." };
    }
    return {
      description: item.description ?? "Unknown credit type",
      modelingNote: item.kindDetail?.modelingNote ?? "",
    };
  });

  return (
    <Show when={showWhenKey()} keyed>
      <>
        <tr class={taxInputFormTableTrClass}>
          <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Credit type">
            <FormStyledSelect
              label="Credit type"
              hideLabel
              value={() => kind() ?? ""}
              onInput={(e) => {
                const newKind = e.currentTarget.value;
                props.setTaxInput((prev) => ({
                  ...prev,
                  rows: patchLineItemRow(prev.rows, "credit", props.rowId, { kind: newKind }),
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
              placeholder="e.g. dependents, institution"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              aria-label="Label (optional)"
              value={label()}
              onInput={(e) => {
                props.setTaxInput((prev) => ({
                  ...prev,
                  rows: patchLineItemRow(prev.rows, "credit", props.rowId, { label: e.currentTarget.value }),
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
                    rows: patchLineItemRow(prev.rows, "credit", props.rowId, { amount: n }),
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
          <td class={creditDetailRowTdClass} colspan={4}>
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
