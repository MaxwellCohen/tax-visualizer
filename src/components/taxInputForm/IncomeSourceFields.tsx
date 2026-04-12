import type { IncomeKind } from "~/lib/taxCalc";
import {
  incomeKindOptions,
  inputClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";

type IncomeSourceFieldsProps = {
  form: TaxInputFormApi;
  rowIndex: number;
  canRemove: boolean;
  onRemove: () => void;
};

export function IncomeSourceTableRow(props: IncomeSourceFieldsProps) {
  const p = `rows[${props.rowIndex}]`;
  return (
    <tr class={taxInputFormTableTrClass}>
      <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
        <props.form.Field name={`${p}.kind`}>
          {(field: any) => (
            <FormStyledSelect
              label="Income type"
              hideLabel
              value={field().state.value}
              onChange={e => field().handleChange(e.currentTarget.value as IncomeKind)}
              onBlur={field().handleBlur}
            >
              {incomeKindOptions.map(opt => (
                <option value={opt.value}>{opt.label}</option>
              ))}
            </FormStyledSelect>
          )}
        </props.form.Field>
      </td>
      <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
        <props.form.Field name={`${p}.label`}>
          {(field: any) => (
            <input
              type="text"
              placeholder="e.g. Employer, Brokerage"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              aria-label="Label (optional)"
              value={field().state.value}
              onInput={e => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
            />
          )}
        </props.form.Field>
      </td>
      <td class={taxInputFormTableTdLabeled} data-label="Amount">
        <props.form.Field name={`${p}.amount`}>
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
  );
}
