// fallow-ignore-file code-duplication
import { Show, createMemo, type Accessor, type Setter } from "solid-js";
import type { ConfigItem } from "~/lib/config/taxPage/types";
import {
  incomeKindSelectOptions,
  inputClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/tax/inputForm/shared";
import { FormCurrencyInput } from "~/components/tax/inputForm/controls/FormCurrencyInput";
import { FormStyledSelect } from "~/components/tax/inputForm/controls/FormStyledSelect";
import { useTaxInputCommitToUrl } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import { FormFieldValidationMessage } from "~/components/tax/inputForm/controls/FormFieldValidationMessage";
import { createLineItemRowState, patchLineItemRow } from "~/components/tax/inputForm/state/lineItemRowState";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxFormData } from "~/lib/tax/form/types";
import type { TaxYearConfig } from "~/lib/tax/data/types";

type IncomeSourceTableRowProps = {
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

export function IncomeSourceTableRow(props: IncomeSourceTableRowProps) {
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
            style={{ background: "var(--color-input)", color: "var(--color-foreground)" }}
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
              color: "var(--color-muted-foreground)",
              border: "1px solid var(--color-border)",
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
