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
import { FormFieldValidationMessage } from "~/components/taxInputForm/FormFieldValidationMessage";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { validateLineItemAmount } from "~/lib/config";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { indexOfTypedRowById } from "~/lib/taxForm.rows";

type IncomeSourceFieldsProps = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  configItems: configItem[];
  isMarriedJoint: boolean;
  taxData: Accessor<TaxYearConfig | null>;
  validationCtx: Accessor<ValidationContext | undefined>;
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

  /** Key `<Show keyed>` by stable row id — not `rows[i]` — so index shifts do not remount the row and reset `<select>`. */
  const showWhenKey = createMemo(() => (rowIndex() >= 0 ? props.rowId : false));
  const kindOptions = createMemo(() => incomeKindSelectOptions(props.configItems, props.isMarriedJoint));
  return (
    <Show when={showWhenKey()} keyed>
      <tr class={taxInputFormTableTrClass}>
        <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
          <FormStyledSelect
            label="Income type"
            hideLabel
            value={() => kind() ?? ""}
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
          <props.form.Field
            name={`${fieldPrefix()}.amount`}
            validators={{
              onChange: ({ value }: { value: unknown }) =>
                validateLineItemAmount(kind(), value as number, props.validationCtx(), props.taxData()),
              onBlur: ({ value }: { value: unknown }) =>
                validateLineItemAmount(kind(), value as number, props.validationCtx(), props.taxData()),
            }}
          >
            {(field: any) => (
              <div>
                <FormCurrencyInput field={field} ariaLabel="Amount" />
                <FormFieldValidationMessage field={field} />
              </div>
            )}
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