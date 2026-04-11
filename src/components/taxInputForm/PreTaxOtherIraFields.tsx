import type { TaxInput } from "~/lib/taxCalc";
import { labelClass } from "~/components/taxInputForm/shared";
import { TraditionalIraFields } from "~/components/taxInputForm/TraditionalIraFields";
import { FormCurrencyInput } from "~/components/taxInputForm/FormCurrencyInput";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";

type Props = {
  form: TaxInputFormApi;
  values: () => TaxInput;
  isMarriedJoint: () => boolean;
  maxIraContribution: () => number | undefined;
  pretaxLimits: () => { traditionalIraContribution: number } | null | undefined;
};

export function PreTaxOtherIraFields(props: Props) {
  return (
    <>
      <props.form.Field name="preTaxOther">
        {field => (
          <label class={`${labelClass} md:max-w-md`} style={{ color: "var(--text-muted)" }}>
            Other (FSA, transit, etc.)
            <FormCurrencyInput field={field} min="0" step="50" />
          </label>
        )}
      </props.form.Field>

      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        <strong class="font-medium" style={{ color: "var(--text)" }}>
          Traditional IRA (deductible)
        </strong>{" "}
        — not withheld from pay; reduces federal ordinary income only (not FICA here). Fully deductible up
        to the IRS cap per person; workplace-plan MAGI phase-outs omitted.
      </p>
      <TraditionalIraFields
        form={props.form}
        values={props.values}
        isMarriedJoint={props.isMarriedJoint}
        maxIraContribution={props.maxIraContribution}
        pretaxLimits={props.pretaxLimits}
      />
    </>
  );
}
