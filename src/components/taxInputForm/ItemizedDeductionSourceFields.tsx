import { Show, createMemo, type Accessor } from "solid-js";
import { getFilingStatusFromRows } from "~/lib/taxCalc.inputs";
import type { TaxFormData } from "~/lib/taxForm.types";
import { indexOfTypedRowById } from "~/lib/taxForm.rows";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import { useTaxInputCommitToUrl } from "~/components/taxInputForm/taxInputFormCommitUrlContext";
import {
  inputClass,
  itemizedDeductionSelectOptions,
  pretaxFieldCaptionClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import { FormFieldValidationMessage } from "~/components/taxInputForm/FormFieldValidationMessage";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { getInputItems, validateLineItemAmount } from "~/lib/config";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
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
  const filingStatus = props.form.useStore((s: { values: TaxFormData }): FilingStatus =>
    getFilingStatusFromRows(s.values.rows) ?? "single",
  );

  const configItems = createMemo(() => {
    const td = props.taxData();
    const fs = filingStatus();
    if (!td) return [];
    return getInputItems(td, fs);
  });

  const kindOptions = createMemo(() => 
    itemizedDeductionSelectOptions('deduction', configItems())
  );

  const rowIndex = props.form.useStore((s: { values: TaxFormData }) =>
    indexOfTypedRowById(s.values.rows, "deduction", props.rowId),
  );

  const kind = props.form.useStore((s: { values: TaxFormData }): string | undefined => {
    const i = indexOfTypedRowById(s.values.rows, "deduction", props.rowId);
    const r = i >= 0 ? s.values.rows[i] : undefined;
    return r?.type === "deduction" ? r.kind : undefined;
  });

  const detail = createMemo(() => {
    const currentKind = kind();
    const items = configItems();
    const item = items.find(item => 
      item.inputRowSettings?.subcategories?.some(sub => sub.key === currentKind)
    );
    
    if (!item) {
      return { description: "Loading...", modelingNote: "Loading..." };
    }
    return {
      description: item.description ?? "Unknown deduction type",
      modelingNote: item.kindDetail?.modelingNote ?? "",
    };
  });

  const fieldPrefix = createMemo(() => {
    const i = rowIndex();
    return i >= 0 ? `rows[${i}]` : "";
  });

  const showWhenKey = createMemo(() => (rowIndex() >= 0 ? props.rowId : false));

  return (
    <Show when={showWhenKey()} keyed>
      <>
        <tr class={taxInputFormTableTrClass}>
          <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Category">
            <FormStyledSelect
              label="Deduction category"
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
                  placeholder="e.g. details, payee"
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