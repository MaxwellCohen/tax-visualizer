import { Show } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { TaxInput } from "~/lib/taxCalc";
import { clampToMax, inputClass, labelClass, money, parseCurrencyInput } from "~/components/taxInputForm/shared";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  values: () => TaxInput;
  isMarriedJoint: () => boolean;
  maxElective401: () => number | undefined;
  pretaxLimits: () => { electiveDeferral401k: number } | null | undefined;
};

export function PreTax401Fields(props: Props) {
  return (
    <div class="grid gap-4 md:grid-cols-2">
      <props.form.Field name="preTax401kSpouse1">
        {field => (
          <label class={labelClass} style={{ color: "var(--text-muted)" }}>
            401(k) / 403(b) — {props.isMarriedJoint() ? "Spouse 1" : "Deferrals"}
            <input
              type="number"
              min="0"
              max={props.maxElective401()}
              step="100"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              value={field().state.value}
              onInput={e =>
                field().handleChange(
                  clampToMax(
                    parseCurrencyInput(e.currentTarget.value),
                    props.maxElective401() ?? Number.POSITIVE_INFINITY,
                  ),
                )
              }
              onBlur={field().handleBlur}
            />
            <span class="text-[0.65rem] font-normal normal-case tracking-normal">
              Max {props.values().taxYear} elective deferral (modeled):{" "}
              {money.format(props.pretaxLimits()?.electiveDeferral401k ?? 0)}
              {props.isMarriedJoint() ? " per spouse" : ""}.
            </span>
          </label>
        )}
      </props.form.Field>
      <Show when={props.isMarriedJoint()}>
        <props.form.Field name="preTax401kSpouse2">
          {field => (
            <label class={labelClass} style={{ color: "var(--text-muted)" }}>
              401(k) / 403(b) — Spouse 2
              <input
                type="number"
                min="0"
                max={props.maxElective401()}
                step="100"
                class={inputClass}
                style={{ background: "var(--input-bg)", color: "var(--text)" }}
                value={field().state.value}
                onInput={e =>
                  field().handleChange(
                    clampToMax(
                      parseCurrencyInput(e.currentTarget.value),
                      props.maxElective401() ?? Number.POSITIVE_INFINITY,
                    ),
                  )
                }
                onBlur={field().handleBlur}
              />
              <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                Same per-spouse max:{" "}
                {money.format(props.pretaxLimits()?.electiveDeferral401k ?? 0)}.
              </span>
            </label>
          )}
        </props.form.Field>
      </Show>
    </div>
  );
}
