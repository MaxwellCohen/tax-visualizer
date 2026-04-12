import { createMemo, type Accessor } from "solid-js";
import type { PretaxBenefitKind } from "~/lib/taxCalc";
import type { TaxFormData } from "~/lib/taxForm.types";
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
import { getPretaxBenefitKindDetail } from "~/lib/pretaxBenefitKindInfo";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";

type Props = {
  form: TaxInputFormApi;
  rowIndex: number;
  canRemove: boolean;
  onRemove: () => void;
  isMarriedJoint: () => boolean;
  pretaxLimits: Accessor<PretaxBenefitLimits | null>;
};

const pretaxDetailRowTdClass =
  "border-t border-(--border-subtle) px-3 pb-3 pt-2.5 md:border-r-0 md:align-top";

export function PretaxBenefitSourceRow(props: Props) {
  const kindOptions = createMemo(() => pretaxBenefitKindSelectOptions(props.isMarriedJoint()));

  const kind = props.form.useStore((s: { values: TaxFormData }): PretaxBenefitKind | undefined => {
    const r = s.values.rows[props.rowIndex];
    return r?.type === "pretax" ? r.kind : undefined;
  });

  const detail = createMemo(() =>
    getPretaxBenefitKindDetail(
      (kind() ?? "preTax401kSpouse1") as PretaxBenefitKind,
      props.pretaxLimits(),
      props.isMarriedJoint(),
    ),
  );

  const p = `rows[${props.rowIndex}]`;

  return (
    <>
      <tr class={taxInputFormTableTrClass}>
        <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
          <props.form.Field name={`${p}.kind`}>
            {(field: any) => (
              <FormStyledSelect
                label="Benefit type"
                hideLabel
                value={field().state.value}
                onChange={e => field().handleChange(e.currentTarget.value as PretaxBenefitKind)}
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
          <props.form.Field name={`${p}.label`}>
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
  );
}
