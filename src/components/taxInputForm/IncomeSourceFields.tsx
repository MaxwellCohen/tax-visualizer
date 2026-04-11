import type { IncomeKind, TaxInput } from "~/lib/taxCalc";
import { incomeKindOptions, inputClass, labelClass } from "~/components/taxInputForm/shared";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";

type IncomeSourceFieldsProps = {
  form: TaxInputFormApi;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
};

export function IncomeSourceFields(props: IncomeSourceFieldsProps) {
  return (
    <div class="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)_auto]">
      <props.form.Field name={`incomeSources[${props.index}].kind`}>
        {field => (
          <FormStyledSelect
            label="Type"
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
      <props.form.Field name={`incomeSources[${props.index}].label`}>
        {field => (
          <label class={labelClass} style={{ color: "var(--text-muted)" }}>
            Label (optional)
            <input
              type="text"
              placeholder="e.g. Employer, Brokerage"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              value={field().state.value}
              onInput={e => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
            />
          </label>
        )}
      </props.form.Field>
      <props.form.Field name={`incomeSources[${props.index}].amount`}>
        {field => (
          <label class={labelClass} style={{ color: "var(--text-muted)" }}>
            Amount
            <FormCurrencyInput field={field} />
          </label>
        )}
      </props.form.Field>
      <div class="flex items-end justify-end pb-0.5">
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
      </div>
    </div>
  );
}
