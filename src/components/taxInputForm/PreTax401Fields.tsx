import { Show } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import { PretaxClampedNumberField } from "~/components/taxInputForm/PretaxClampedNumberField";
import { money, pretaxFieldCaptionClass } from "~/components/taxInputForm/shared";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";

type Props = {
  form: TaxInputFormApi;
  values: () => TaxInput;
  isMarriedJoint: () => boolean;
  maxElective401: () => number | undefined;
  pretaxLimits: () => { electiveDeferral401k: number } | null | undefined;
};

export function PreTax401Fields(props: Props) {
  return (
    <div class="grid gap-4 md:grid-cols-2">
      <PretaxClampedNumberField
        form={props.form}
        name="preTax401kSpouse1"
        labelText={() =>
          `401(k) / 403(b) — ${props.isMarriedJoint() ? "Spouse 1" : "Deferrals"}`
        }
        max={props.maxElective401}
        step="100"
        caption={
          <span class={pretaxFieldCaptionClass}>
            Max {props.values().taxYear} elective deferral (modeled):{" "}
            {money.format(props.pretaxLimits()?.electiveDeferral401k ?? 0)}
            {props.isMarriedJoint() ? " per spouse" : ""}.
          </span>
        }
      />
      <Show when={props.isMarriedJoint()}>
        <PretaxClampedNumberField
          form={props.form}
          name="preTax401kSpouse2"
          labelText={() => "401(k) / 403(b) — Spouse 2"}
          max={props.maxElective401}
          step="100"
          caption={
            <span class={pretaxFieldCaptionClass}>
              Same per-spouse max:{" "}
              {money.format(props.pretaxLimits()?.electiveDeferral401k ?? 0)}.
            </span>
          }
        />
      </Show>
    </div>
  );
}
