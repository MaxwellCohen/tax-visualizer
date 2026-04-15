import { Show, createMemo, type Accessor } from "solid-js";
import type { ItemizedDeductionKind } from "~/lib/taxCalc";
import { getFilingStatusFromRows } from "~/lib/taxCalc.inputs";
import type { TaxFormData } from "~/lib/taxForm.types";
import { indexOfTypedRowById } from "~/lib/taxForm.rows";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import {
  inputClass,
  itemizedDeductionKindSelectOptions,
  pretaxFieldCaptionClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { getInputItems, findConfigItemForDeductionKind } from "~/lib/config";
import type { TaxYearConfig } from "~/lib/taxData.types";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  taxData: Accessor<TaxYearConfig | null>;
};

const deductionDetailRowTdClass =
  "border-t border-(--border-subtle) px-3 pb-3 pt-2.5 md:border-r-0 md:align-top";

export function ItemizedDeductionSourceRow(props: Props) {
  const kindOptions = createMemo(() => itemizedDeductionKindSelectOptions());

  const kind = props.form.useStore((s: { values: TaxFormData }): ItemizedDeductionKind | undefined => {
    const i = indexOfTypedRowById(s.values.rows, "deduction", props.rowId);
    const r = i >= 0 ? s.values.rows[i] : undefined;
    return r?.type === "deduction" ? r.kind : undefined;
  });

  const filingStatus = props.form.useStore((s: { values: TaxFormData }) =>
    getFilingStatusFromRows(s.values.rows),
  );

  const detail = createMemo(() => {
    const td = props.taxData();
    const fs = filingStatus();
    if (!td) {
      return { description: "Loading...", modelingNote: "Loading..." };
    }
    const items = getInputItems(td, fs);
    const item = findConfigItemForDeductionKind(items, (kind() ?? "") as string);
    return {
      description: item?.description ?? "Unknown deduction type",
      modelingNote: item?.kindDetail?.modelingNote ?? "",
    };
  });

  const rowIndex = createMemo(() => indexOfTypedRowById(props.values().rows, "deduction", props.rowId));
  const fieldPrefix = createMemo(() => {
    const i = rowIndex();
    return i >= 0 ? `rows[${i}]` : "";
  });

  return (
    <Show when={fieldPrefix()} keyed>
      <>
        <tr class={taxInputFormTableTrClass}>
          <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Category">
            <props.form.Field name={`${fieldPrefix()}.kind`}>
              {(field: any) => (
                <FormStyledSelect
                  label="Deduction category"
                  hideLabel
                  value={field().state.value}
                  onChange={e => field().handleChange(e.currentTarget.value as ItemizedDeductionKind)}
                  onBlur={field().handleBlur}
                >
                  {kindOptions().map(opt => (
                    <option value={opt.value}>{opt.label}</option>
                  ))}
                </FormStyledSelect>
              )}
            </props.form.Field>
          </td>
          <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
            <props.form.Field name={`${fieldPrefix()}.label`}>
              {(field: any) => (
                <input
                  type="text"
                  placeholder="e.g. details, payee"
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
