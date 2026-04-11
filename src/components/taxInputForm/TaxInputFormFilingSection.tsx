import type { Accessor } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";
import type { FilingStatus } from "~/lib/taxData";
import { isPlanningTaxYear } from "~/lib/taxData";
import { filingStatusOptions } from "~/components/taxInputForm/shared";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxInput>;
  availableYears: number[];
};

export function TaxInputFormFilingSection(props: Props) {
  return (
    <section class="space-y-4">
      <h2
        class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Filing Details
      </h2>
      <div class="grid gap-4 md:grid-cols-2">
        <props.form.Field name="taxYear">
          {field => (
            <FormStyledSelect
              label="Tax Year"
              value={field().state.value}
              onChange={e => field().handleChange(Number(e.currentTarget.value))}
              onBlur={field().handleBlur}
            >
              {props.availableYears.map(year => (
                <option value={year}>{year}</option>
              ))}
            </FormStyledSelect>
          )}
        </props.form.Field>

        <props.form.Field name="filingStatus">
          {field => (
            <FormStyledSelect
              label="Filing Status"
              value={field().state.value}
              onChange={e => field().handleChange(e.currentTarget.value as FilingStatus)}
              onBlur={field().handleBlur}
            >
              {filingStatusOptions.map(option => (
                <option value={option.value}>{option.label}</option>
              ))}
            </FormStyledSelect>
          )}
        </props.form.Field>
      </div>
      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {isPlanningTaxYear(props.values().taxYear)
          ? `${props.values().taxYear} uses planning figures for inflation-adjusted federal tax data and contribution caps. Treat it as directional until final IRS guidance is published.`
          : `${props.values().taxYear} uses finalized federal bracket, deduction, payroll, and contribution-limit figures in this app.`}
      </p>
    </section>
  );
}
