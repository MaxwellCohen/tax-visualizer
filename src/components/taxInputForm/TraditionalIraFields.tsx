import { Show } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { TaxInput } from "~/lib/taxCalc";
import { clampToMax, inputClass, labelClass, money, parseCurrencyInput } from "~/components/taxInputForm/shared";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  values: () => TaxInput;
  isMarriedJoint: () => boolean;
  maxIraContribution: () => number | undefined;
  pretaxLimits: () => { traditionalIraContribution: number } | null | undefined;
};

export function TraditionalIraFields(props: Props) {
  return (
    <div class="grid gap-4 md:grid-cols-2">
      <props.form.Field name="traditionalIraSpouse1">
        {field => (
          <label class={labelClass} style={{ color: "var(--text-muted)" }}>
            Traditional IRA — {props.isMarriedJoint() ? "Spouse 1" : "Contribution"}
            <input
              type="number"
              min="0"
              max={props.maxIraContribution()}
              step="100"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              value={field().state.value}
              onInput={e =>
                field().handleChange(
                  clampToMax(
                    parseCurrencyInput(e.currentTarget.value),
                    props.maxIraContribution() ?? Number.POSITIVE_INFINITY,
                  ),
                )
              }
              onBlur={field().handleBlur}
            />
            <span class="text-[0.65rem] font-normal normal-case tracking-normal">
              Max {props.values().taxYear} (modeled, under age 50):{" "}
              {money.format(props.pretaxLimits()?.traditionalIraContribution ?? 0)}
              {props.isMarriedJoint() ? " per spouse" : ""}.
            </span>
          </label>
        )}
      </props.form.Field>
      <Show when={props.isMarriedJoint()}>
        <props.form.Field name="traditionalIraSpouse2">
          {field => (
            <label class={labelClass} style={{ color: "var(--text-muted)" }}>
              Traditional IRA — Spouse 2
              <input
                type="number"
                min="0"
                max={props.maxIraContribution()}
                step="100"
                class={inputClass}
                style={{ background: "var(--input-bg)", color: "var(--text)" }}
                value={field().state.value}
                onInput={e =>
                  field().handleChange(
                    clampToMax(
                      parseCurrencyInput(e.currentTarget.value),
                      props.maxIraContribution() ?? Number.POSITIVE_INFINITY,
                    ),
                  )
                }
                onBlur={field().handleBlur}
              />
              <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                Same per-spouse cap:{" "}
                {money.format(props.pretaxLimits()?.traditionalIraContribution ?? 0)}.
              </span>
            </label>
          )}
        </props.form.Field>
      </Show>
    </div>
  );
}
