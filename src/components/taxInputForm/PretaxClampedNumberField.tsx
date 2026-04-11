import type { Accessor, JSX } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { TaxInput } from "~/lib/taxCalc";
import { clampToMax, inputClass, labelClass, parseCurrencyInput } from "~/components/taxInputForm/shared";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  name: keyof TaxInput;
  labelText: Accessor<string>;
  max: Accessor<number | undefined>;
  step: string;
  caption: JSX.Element;
};

/** Shared clamped USD number input for pre-tax spouse fields (401(k), HSA, traditional IRA). */
export function PretaxClampedNumberField(props: Props) {
  return (
    <props.form.Field name={props.name}>
      {field => (
        <label class={labelClass} style={{ color: "var(--text-muted)" }}>
          {props.labelText()}
          <input
            type="number"
            min="0"
            max={props.max()}
            step={props.step}
            class={inputClass}
            style={{ background: "var(--input-bg)", color: "var(--text)" }}
            value={field().state.value}
            onInput={e =>
              field().handleChange(
                clampToMax(
                  parseCurrencyInput(e.currentTarget.value),
                  props.max() ?? Number.POSITIVE_INFINITY,
                ),
              )
            }
            onBlur={field().handleBlur}
          />
          {props.caption}
        </label>
      )}
    </props.form.Field>
  );
}
