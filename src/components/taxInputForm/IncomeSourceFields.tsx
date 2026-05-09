// fallow-ignore-file code-duplication
import { Show, createMemo, type Accessor, type Setter } from "solid-js";
import type { ConfigItem } from "~/lib/config/page/pageConfig.types";
import {
  incomeKindSelectOptions,
  inputClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import { useTaxInputCommitToUrl } from "~/components/taxInputForm/taxInputFormCommitUrlContext";
import { FormFieldValidationMessage } from "~/components/taxInputForm/FormFieldValidationMessage";
import { createLineItemRowState, patchLineItemRow } from "~/components/taxInputForm/lineItemRowState";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { TaxYearConfig } from "~/lib/taxData.types";

type IncomeSourceFieldsProps = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  configItems: ConfigItem[];
  isMarriedJoint: boolean;
  taxData: Accessor<TaxYearConfig | null>;
  validationCtx: Accessor<ValidationContext | undefined>;
};

export function IncomeSourceTableRow(props: IncomeSourceFieldsProps) {
  const commitToUrl = useTaxInputCommitToUrl();
  const { kind, label, amount, amountError, revalidateAmount, showWhenKey } = createLineItemRowState({
    taxInput: props.taxInput,
    rowId: props.rowId,
    rowType: "income",
    taxData: props.taxData,
    validationCtx: props.validationCtx,
  });
  const kindOptions = createMemo(() => incomeKindSelectOptions(props.configItems, props.isMarriedJoint));

  return (
    <Show when={showWhenKey()} keyed>
      <tr class={taxInputFormTableTrClass}>
        <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
          <FormStyledSelect
            label="Income type"
            hideLabel
            value={() => kind() ?? ""}
            onInput={(e) => {
              const newKind = e.currentTarget.value;
              props.setTaxInput((prev) => ({ ...prev, rows: patchLineItemRow(prev.rows, "income", props.rowId, { kind: newKind }) }));
              const n = amount();
              revalidateAmount(n);
            }}
            onBlur={() => {}}
            options={kindOptions()}
          />
        </td>
        <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
          <input
            type="text"
            placeholder="e.g. Employer, Brokerage"
            class={inputClass}
            style={{ background: "var(--input-bg)", color: "var(--text)" }}
            aria-label="Label (optional)"
            value={label()}
            onInput={(e) => {
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchLineItemRow(prev.rows, "income", props.rowId, { label: e.currentTarget.value }),
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
                props.setTaxInput((prev) => ({ ...prev, rows: patchLineItemRow(prev.rows, "income", props.rowId, { amount: n }) }));
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
            title={props.canRemove ? "Remove this source" : "Keep at least one row"}
            onClick={() => props.onRemove()}
          >
            Remove
          </button>
        </td>
      </tr>
    </Show>
  );
}
