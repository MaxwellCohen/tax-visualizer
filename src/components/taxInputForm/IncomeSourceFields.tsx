import { Show, createMemo, type Accessor } from "solid-js";
import type { configItem } from "~/lib/config/page/pageConfig.types";
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
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import type { TaxFormData } from "~/lib/taxForm.types";
import { indexOfTypedRowById } from "~/lib/taxForm.rows";

type IncomeSourceFieldsProps = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  configItems: configItem[];
  isMarriedJoint: boolean;
};

export function IncomeSourceTableRow(props: IncomeSourceFieldsProps) {
  const commitToUrl = useTaxInputCommitToUrl();
  const rowIndex = props.form.useStore((s: { values: TaxFormData }) =>
    indexOfTypedRowById(s.values.rows, "income", props.rowId),
  );
  const kind = props.form.useStore((s: { values: TaxFormData }): string | undefined => {
    const i = indexOfTypedRowById(s.values.rows, "income", props.rowId);
    const r = i >= 0 ? s.values.rows[i] : undefined;
    return r?.type === "income" ? r.kind : undefined;
  });
  const fieldPrefix = createMemo(() => {
    const i = rowIndex();
    return i >= 0 ? `rows[${i}]` : "";
  });
  const kindOptions = createMemo(() => incomeKindSelectOptions(props.configItems, props.isMarriedJoint));
  return (
    <Show when={fieldPrefix()} keyed>
      <tr class={taxInputFormTableTrClass}>
        <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
          <FormStyledSelect
            label="Income type"
            hideLabel
            value={kind() ?? ""}
            onChange={(e) => {
              const i = rowIndex();
              if (i < 0) return;
              void props.form.setFieldValue(`rows[${i}].kind`, e.currentTarget.value);
            }}
            onBlur={() => {
              commitToUrl?.();
            }}
            options={kindOptions()}
          />
        </td>
        <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
          <props.form.Field name={`${fieldPrefix()}.label`}>
            {(field: any) => (
              <input
                type="text"
                placeholder="e.g. Employer, Brokerage"
                class={inputClass}
                style={{ background: "var(--input-bg)", color: "var(--text)" }}
                aria-label="Label (optional)"
                value={field().state.value}
                onInput={e => field().handleChange(e.currentTarget.value)}
                onBlur={() => {
                  field().handleBlur();
                  commitToUrl?.();
                }}
              />
            )}
          </props.form.Field>
        </td>
        <td class={taxInputFormTableTdLabeled} data-label="Amount">
          <props.form.Field name={`${fieldPrefix()}.amount`}>
            {(field: any) => <FormCurrencyInput field={field} ariaLabel="Amount" />}
          </props.form.Field>
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