import { Show } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import { inputClass, labelClass, money, parseCurrencyInput } from "~/components/taxInputForm/shared";
import type { TaxInput } from "~/lib/taxCalc";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  values: Accessor<TaxInput>;
  standardDeduction: Accessor<number>;
  itemizedBeatsStandard: Accessor<boolean>;
};

export function TaxInputFormDeductionSection(props: Props) {
  return (
    <section class="space-y-4">
      <h2
        class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Deductions
      </h2>
      <props.form.Field name="useItemizedDeductions">
        {field => (
          <label
            class="flex items-center gap-2.5 text-sm cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            <input
              type="checkbox"
              checked={field().state.value}
              onChange={e => field().handleChange(e.currentTarget.checked)}
              onBlur={field().handleBlur}
              class="h-4 w-4 rounded"
              style={{ "accent-color": "var(--accent)" }}
            />
            Use itemized deductions
          </label>
        )}
      </props.form.Field>
      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Standard deduction for this year and filing status: {money.format(props.standardDeduction())}.
      </p>

      <Show when={props.values().useItemizedDeductions}>
        <>
          <props.form.Field name="itemizedDeductions">
            {field => (
              <label class={`${labelClass} md:max-w-sm`} style={{ color: "var(--text-muted)" }}>
                Itemized Deduction Amount
                <input
                  type="number"
                  min="0"
                  step="100"
                  class={inputClass}
                  style={{ background: "var(--input-bg)", color: "var(--text)" }}
                  value={field().state.value}
                  onInput={e =>
                    field().handleChange(parseCurrencyInput(e.currentTarget.value))
                  }
                  onBlur={field().handleBlur}
                />
              </label>
            )}
          </props.form.Field>
          <p
            class="rounded-lg px-3 py-2 text-xs leading-relaxed"
            style={{
              background: props.itemizedBeatsStandard() ? "var(--accent-muted)" : "var(--warning-bg)",
              color: props.itemizedBeatsStandard() ? "var(--accent)" : "var(--warning-text)",
              border: `1px solid ${props.itemizedBeatsStandard() ? "var(--border)" : "var(--warning-border)"}`,
            }}
          >
            {props.itemizedBeatsStandard()
              ? `Itemized deductions currently exceed the standard deduction by ${money.format(props.values().itemizedDeductions - props.standardDeduction())}.`
              : `Itemized deductions are currently ${money.format(props.standardDeduction() - props.values().itemizedDeductions)} below the standard deduction, so the standard deduction would usually produce a lower federal tax bill.`}
          </p>
        </>
      </Show>
    </section>
  );
}
