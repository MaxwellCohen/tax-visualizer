import { createMemo, type Accessor } from "solid-js";
import type { PretaxBenefitKind, TaxInput } from "~/lib/taxCalc";
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
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  isMarriedJoint: () => boolean;
  pretaxLimits: Accessor<PretaxBenefitLimits | null>;
};

const pretaxDetailRowTdClass =
  "border-t border-(--border-subtle) px-3 pb-3 pt-2.5 md:border-r-0 md:align-top";

export function PretaxBenefitSourceRow(props: Props) {
  const kindOptions = createMemo(() => pretaxBenefitKindSelectOptions(props.isMarriedJoint()));

  const kind = props.form.useStore((s: { values: TaxInput }): PretaxBenefitKind | undefined =>
    s.values.pretaxBenefitSources[props.index]?.kind,
  );

  const detail = createMemo(() =>
    getPretaxBenefitKindDetail(
      (kind() ?? "preTax401kSpouse1") as PretaxBenefitKind,
      props.pretaxLimits(),
      props.isMarriedJoint(),
    ),
  );

  return (
    <>
      <tr class={taxInputFormTableTrClass}>
        <td class={`${taxInputFormTableTdLabeled} pl-3`} data-label="Type">
          <props.form.Field name={`pretaxBenefitSources[${props.index}].kind`}>
            {field => (
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
          <props.form.Field name={`pretaxBenefitSources[${props.index}].label`}>
            {field => (
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
          <props.form.Field name={`pretaxBenefitSources[${props.index}].amount`}>
            {field => <FormCurrencyInput field={field} ariaLabel="Amount" />}
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
