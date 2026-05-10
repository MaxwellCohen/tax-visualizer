import type { Accessor, JSX } from "solid-js";
import { FormCurrencyInput } from "~/components/tax/inputForm/controls/FormCurrencyInput";
import { FormFieldValidationMessage } from "~/components/tax/inputForm/controls/FormFieldValidationMessage";
import { FormStyledSelect } from "~/components/tax/inputForm/controls/FormStyledSelect";
import {
  inputClass,
  pretaxFieldCaptionClass,
  taxInputFormLineItemDetailRowTdClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
} from "~/components/tax/inputForm/shared";

type SelectOption = { value: string | number; label: string };

export function LineItemKindSelectCell(props: {
  dataLabel: string;
  selectLabel: string;
  kindValue: Accessor<string | undefined>;
  options: SelectOption[];
  onKindInput: (e: Event & { currentTarget: HTMLSelectElement }) => void;
}) {
  return (
    <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label={props.dataLabel}>
      <FormStyledSelect
        label={props.selectLabel}
        hideLabel
        value={() => props.kindValue() ?? ""}
        onInput={props.onKindInput}
        onBlur={() => {}}
        options={props.options}
      />
    </td>
  );
}

export function LineItemOptionalLabelCell(props: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onBlurCommit: () => void;
}) {
  return (
    <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
      <input
        type="text"
        placeholder={props.placeholder}
        class={`${inputClass} bg-input text-foreground`}
        aria-label="Label (optional)"
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        onBlur={props.onBlurCommit}
      />
    </td>
  );
}

export function LineItemAmountCell(props: {
  value: number;
  amountError: Accessor<string | undefined>;
  onAmountChange: (n: number) => void;
}) {
  return (
    <td class={taxInputFormTableTdLabeled} data-label="Amount">
      <div>
        <FormCurrencyInput
          value={props.value}
          onInput={props.onAmountChange}
          onBlur={() => {}}
          ariaLabel="Amount"
        />
        <FormFieldValidationMessage message={props.amountError} />
      </div>
    </td>
  );
}

export type LineItemRemoveEntity = "source" | "line";

export function LineItemRemoveActionsCell(props: {
  canRemove: boolean;
  onRemove: () => void;
  entity: LineItemRemoveEntity;
}) {
  const removeTitle = () =>
    props.canRemove
      ? props.entity === "source"
        ? "Remove this source"
        : "Remove this line"
      : props.entity === "source"
        ? "Keep at least one row"
        : "Keep at least one line";

  return (
    <td class={taxInputFormTableTdActions}>
      <button
        type="button"
        class="rounded-md border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground"
        disabled={!props.canRemove}
        title={removeTitle()}
        onClick={() => props.onRemove()}
      >
        Remove
      </button>
    </td>
  );
}

export function LineItemDetailSubRow(props: { children: JSX.Element }) {
  return (
    <tr class="md:table-row max-md:block max-md:w-full max-md:border-0 max-md:bg-transparent max-md:p-0">
      <td class={taxInputFormLineItemDetailRowTdClass} colspan={4}>
        <div class={`${pretaxFieldCaptionClass} space-y-1 text-muted-foreground`}>{props.children}</div>
      </td>
    </tr>
  );
}
