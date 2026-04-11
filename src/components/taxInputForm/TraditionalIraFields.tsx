import { Show } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import { PretaxClampedNumberField } from "~/components/taxInputForm/PretaxClampedNumberField";
import { money, pretaxFieldCaptionClass } from "~/components/taxInputForm/shared";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";

type Props = {
  form: TaxInputFormApi;
  values: () => TaxInput;
  isMarriedJoint: () => boolean;
  maxIraContribution: () => number | undefined;
  pretaxLimits: () => { traditionalIraContribution: number } | null | undefined;
};

export function TraditionalIraFields(props: Props) {
  return (
    <div class="grid gap-4 md:grid-cols-2">
      <PretaxClampedNumberField
        form={props.form}
        name="traditionalIraSpouse1"
        labelText={() =>
          `Traditional IRA — ${props.isMarriedJoint() ? "Spouse 1" : "Contribution"}`
        }
        max={props.maxIraContribution}
        step="100"
        caption={
          <span class={pretaxFieldCaptionClass}>
            Max {props.values().taxYear} (modeled, under age 50):{" "}
            {money.format(props.pretaxLimits()?.traditionalIraContribution ?? 0)}
            {props.isMarriedJoint() ? " per spouse" : ""}.
          </span>
        }
      />
      <Show when={props.isMarriedJoint()}>
        <PretaxClampedNumberField
          form={props.form}
          name="traditionalIraSpouse2"
          labelText={() => "Traditional IRA — Spouse 2"}
          max={props.maxIraContribution}
          step="100"
          caption={
            <span class={pretaxFieldCaptionClass}>
              Same per-spouse cap:{" "}
              {money.format(props.pretaxLimits()?.traditionalIraContribution ?? 0)}.
            </span>
          }
        />
      </Show>
    </div>
  );
}
