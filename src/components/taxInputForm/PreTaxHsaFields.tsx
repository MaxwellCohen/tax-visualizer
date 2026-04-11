import { Show } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { TaxInput } from "~/lib/taxCalc";
import { clampToMax, inputClass, labelClass, money, parseCurrencyInput } from "~/components/taxInputForm/shared";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  values: () => TaxInput;
  isMarriedJoint: () => boolean;
  maxHsaSpouse1: () => number | undefined;
  maxHsaSpouse2: () => number | undefined;
  pretaxLimits: () => { hsaSelfOnly: number; hsaFamily: number } | null | undefined;
};

export function PreTaxHsaFields(props: Props) {
  return (
    <div class="grid gap-4 md:grid-cols-2">
      <props.form.Field name="preTaxHsaSpouse1">
        {field => (
          <label class={labelClass} style={{ color: "var(--text-muted)" }}>
            HSA (payroll) — {props.isMarriedJoint() ? "Spouse 1" : "Total"}
            <input
              type="number"
              min="0"
              max={props.maxHsaSpouse1()}
              step="50"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              value={field().state.value}
              onInput={e =>
                field().handleChange(
                  clampToMax(
                    parseCurrencyInput(e.currentTarget.value),
                    props.maxHsaSpouse1() ?? Number.POSITIVE_INFINITY,
                  ),
                )
              }
              onBlur={field().handleBlur}
            />
            <Show
              when={props.isMarriedJoint()}
              fallback={
                <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                  Modeled cap: self-only HDHP ({money.format(props.pretaxLimits()?.hsaSelfOnly ?? 0)} for{" "}
                  {props.values().taxYear}). Family HDHP is {money.format(props.pretaxLimits()?.hsaFamily ?? 0)}{" "}
                  combined (married filing jointly only here).
                </span>
              }
            >
              <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                Family HDHP combined payroll cap (typ. {props.values().taxYear}):{" "}
                {money.format(props.pretaxLimits()?.hsaFamily ?? 0)}. Self-only HDHP: up to{" "}
                {money.format(props.pretaxLimits()?.hsaSelfOnly ?? 0)} per spouse.
              </span>
            </Show>
          </label>
        )}
      </props.form.Field>
      <Show when={props.isMarriedJoint()}>
        <props.form.Field name="preTaxHsaSpouse2">
          {field => (
            <label class={labelClass} style={{ color: "var(--text-muted)" }}>
              HSA (payroll) — Spouse 2
              <input
                type="number"
                min="0"
                max={props.maxHsaSpouse2()}
                step="50"
                class={inputClass}
                style={{ background: "var(--input-bg)", color: "var(--text)" }}
                value={field().state.value}
                onInput={e =>
                  field().handleChange(
                    clampToMax(
                      parseCurrencyInput(e.currentTarget.value),
                      props.maxHsaSpouse2() ?? Number.POSITIVE_INFINITY,
                    ),
                  )
                }
                onBlur={field().handleBlur}
              />
              <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                Split payroll HSA however you like; family coverage total is still capped.
              </span>
            </label>
          )}
        </props.form.Field>
      </Show>
    </div>
  );
}
