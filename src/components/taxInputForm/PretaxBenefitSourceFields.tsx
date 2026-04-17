import { Show, createMemo, type Accessor } from "solid-js";
import type { TaxFormData } from "~/lib/taxForm.types";
import { indexOfTypedRowById } from "~/lib/taxForm.rows";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import {
  inputClass,
  pretaxBenefitKindSelectOptions,
  pretaxFieldCaptionClass,
  taxInputFormTableTdActions,
  taxInputFormTableTdLabeled,
  taxInputFormTableTrClass,
} from "~/components/taxInputForm/shared";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { getInputItems } from "~/lib/config";
import type { configItem } from "~/lib/config/page/pageConfig.types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  rowId: string;
  canRemove: boolean;
  onRemove: () => void;
  isMarriedJoint: () => boolean;
  taxData: Accessor<TaxYearConfig | null>;
  filingStatus: Accessor<FilingStatus>;
};

const pretaxDetailRowTdClass =
  "border-t border-(--border-subtle) px-3 pb-3 pt-2.5 md:border-r-0 md:align-top";

export function PretaxBenefitSourceRow(props: Props) {
  const configItems = createMemo(() => {
    const td = props.taxData();
    const fs = props.filingStatus();
    if (!td) return [];
    return getInputItems(td, fs);
  });

  const kindOptions = createMemo(() => 
    pretaxBenefitKindSelectOptions(configItems(), props.isMarriedJoint())
  );

  const kind = props.form.useStore((s: { values: TaxFormData }): string | undefined => {
    const i = indexOfTypedRowById(s.values.rows, "pretax", props.rowId);
    const r = i >= 0 ? s.values.rows[i] : undefined;
    return r?.type === "pretax" ? r.kind : undefined;
  });

  const detail = createMemo(() => {
    const currentKind = kind();
    const items = configItems();
    const item = items.find(item => 
      item.inputRowSettings?.subcategories?.some(sub => sub.key === currentKind)
    ) ?? items.find(i => i.id === "input-pretax-otherPretax");
    
    if (!item) {
      return { description: "Loading...", limitNote: "Loading..." };
    }
    return {
      description: item.description ?? "Unknown pretax benefit type",
      limitNote: item.kindDetail?.limitNote ?? "",
    };
  });

  const rowIndex = createMemo(() => indexOfTypedRowById(props.values().rows, "pretax", props.rowId));
  const fieldPrefix = createMemo(() => {
    const i = rowIndex();
    return i >= 0 ? `rows[${i}]` : "";
  });

  return (
    <Show when={fieldPrefix()} keyed>
      <>
        <tr class={taxInputFormTableTrClass}>
          <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
            <props.form.Field name={`${fieldPrefix()}.kind`}>
              {(field: any) => (
                <FormStyledSelect
                  label="Benefit type"
                  hideLabel
                  value={field().state.value}
                  onChange={e => field().handleChange(e.currentTarget.value)}
                  onBlur={field().handleBlur}
                  options={kindOptions()}
                />
              )}
            </props.form.Field>
          </td>
          <td class={taxInputFormTableTdLabeled} data-label="Label (optional)">
            <props.form.Field name={`${fieldPrefix()}.label`}>
              {(field: any) => (
                <input
                  type="text"
                  placeholder="e.g. Employer plan, bank"
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
          <td class={pretaxDetailRowTdClass} colspan={4}>
            <div class={`${pretaxFieldCaptionClass} space-y-1 text-(--text-muted)`}>
              <p class="leading-snug">{detail().description}</p>
              <p class="leading-snug">{detail().limitNote}</p>
            </div>
          </td>
        </tr>
      </>
    </Show>
  );
}