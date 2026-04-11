import { Show } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import { PretaxClampedNumberField } from "~/components/taxInputForm/PretaxClampedNumberField";
import { money, pretaxFieldCaptionClass } from "~/components/taxInputForm/shared";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";

type Props = {
  form: TaxInputFormApi;
  values: () => TaxInput;
  isMarriedJoint: () => boolean;
  maxHsaSpouse1: () => number | undefined;
  maxHsaSpouse2: () => number | undefined;
  pretaxLimits: () => { hsaSelfOnly: number; hsaFamily: number } | null | undefined;
};

export function PreTaxHsaFields(props: Props) {
  return (
    <div class="grid gap-4 md:grid-cols-2">
      <PretaxClampedNumberField
        form={props.form}
        name="preTaxHsaSpouse1"
        labelText={() => `HSA (payroll) — ${props.isMarriedJoint() ? "Spouse 1" : "Total"}`}
        max={props.maxHsaSpouse1}
        step="50"
        caption={
          <Show
            when={props.isMarriedJoint()}
            fallback={
              <span class={pretaxFieldCaptionClass}>
                Modeled cap: self-only HDHP ({money.format(props.pretaxLimits()?.hsaSelfOnly ?? 0)} for{" "}
                {props.values().taxYear}). Family HDHP is {money.format(props.pretaxLimits()?.hsaFamily ?? 0)}{" "}
                combined (married filing jointly only here).
              </span>
            }
          >
            <span class={pretaxFieldCaptionClass}>
              Family HDHP combined payroll cap (typ. {props.values().taxYear}):{" "}
              {money.format(props.pretaxLimits()?.hsaFamily ?? 0)}. Self-only HDHP: up to{" "}
              {money.format(props.pretaxLimits()?.hsaSelfOnly ?? 0)} per spouse.
            </span>
          </Show>
        }
      />
      <Show when={props.isMarriedJoint()}>
        <PretaxClampedNumberField
          form={props.form}
          name="preTaxHsaSpouse2"
          labelText={() => "HSA (payroll) — Spouse 2"}
          max={props.maxHsaSpouse2}
          step="50"
          caption={
            <span class={pretaxFieldCaptionClass}>
              Split payroll HSA however you like; family coverage total is still capped.
            </span>
          }
        />
      </Show>
    </div>
  );
}
