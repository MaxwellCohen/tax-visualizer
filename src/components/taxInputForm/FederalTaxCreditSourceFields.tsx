import { Show, createMemo, type Accessor } from "solid-js";
import type { TaxFormData } from "~/lib/taxForm.types";
import { indexOfTypedRowById } from "~/lib/taxForm.rows";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import { useTaxInputCommitToUrl } from "~/components/taxInputForm/taxInputFormCommitUrlContext";
import {
  itemizedDeductionSelectOptions,
  inputClass,
  pretaxFieldCaptionClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { getInputItems } from "~/lib/config";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
};

const creditDetailRowTdClass =
  "border-t border-(--border-subtle) px-3 pb-3 pt-2.5 md:border-r-0 md:align-top";

export function FederalTaxCreditSourceRow(props: Props) {
  const commitToUrl = useTaxInputCommitToUrl();
  const configItems = createMemo(() => {
    const td = props.taxData();
    const fs = props.filingStatus();
    if (!td) return [];
    return getInputItems(td, fs);
  });

  const kindOptions = createMemo(() => 
    itemizedDeductionSelectOptions('credit', configItems())
  );

  const rowIndex = props.form.useStore((s: { values: TaxFormData }) =>
    indexOfTypedRowById(s.values.rows, "credit", props.rowId),
  );

  const kind = props.form.useStore((s: { values: TaxFormData }): string | undefined => {
    const i = indexOfTypedRowById(s.values.rows, "credit", props.rowId);
    const r = i >= 0 ? s.values.rows[i] : undefined;
    return r?.type === "credit" ? r.kind : undefined;
  });

  const detail = createMemo(() => {
    const currentKind = kind();
    const items = configItems();
    const item = items.find(item => 
      item.inputRowSettings?.subcategories?.some(sub => sub.key === currentKind)
    ) ?? items.find(i => i.inputRowSettings?.category === "credit");
    
    if (!item) {
      return { description: "Loading...", modelingNote: "Loading..." };
    }
    return {
      description: item.description ?? "Unknown credit type",
      modelingNote: item.kindDetail?.modelingNote ?? "",
    };
  });

  const fieldPrefix = createMemo(() => {
    const i = rowIndex();
    return i >= 0 ? `rows[${i}]` : "";
  });

  return (
    <Show when={fieldPrefix()} keyed>
      <>
        <tr class={taxInputFormTableTrClass}>
          <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Credit type">
            <FormStyledSelect
              label="Credit type"
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
                  placeholder="e.g. dependents, institution"
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