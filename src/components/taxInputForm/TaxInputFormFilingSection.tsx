import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import { getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { settingRowIndex } from "~/lib/taxForm.rows";
import type { TaxFormData } from "~/lib/taxForm.types";
import type { FilingStatus } from "~/lib/taxData";
import { isPlanningTaxYear } from "~/lib/taxData";
import { filingStatusOptions } from "~/components/taxInputForm/shared";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  availableYears: number[];
};

export function TaxInputFormFilingSection(props: Props) {
  const taxYearIdx = createMemo(() => settingRowIndex(props.values().rows, "taxYear"));
  const filingIdx = createMemo(() => settingRowIndex(props.values().rows, "filingStatus"));
  const taxYear = createMemo(() => getTaxYearFromRows(props.values().rows));

  return (
    <section class="space-y-4">
      <h2
        class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Filing Details
      </h2>
      <div class="grid gap-4 md:grid-cols-2">
        <props.form.Field name={`rows[${taxYearIdx()}].value`}>
          {(field: any) => (
            <FormStyledSelect
              label="Tax Year"
              value={field().state.value as number}
              onChange={e => field().handleChange(Number(e.currentTarget.value))}
              onBlur={field().handleBlur}
              options={props.availableYears.map(year => ({ value: year, label: String(year) }))}
            />
          )}
        </props.form.Field>

        <props.form.Field name={`rows[${filingIdx()}].value`}>
          {(field: any) => (
            <FormStyledSelect
              label="Filing Status"
              value={field().state.value as FilingStatus}
              onChange={e => field().handleChange(e.currentTarget.value as FilingStatus)}
              onBlur={field().handleBlur}
              options={filingStatusOptions}
            />
          )}
        </props.form.Field>
      </div>
      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {isPlanningTaxYear(taxYear())
          ? `${taxYear()} uses planning figures for inflation-adjusted federal tax data and contribution caps. Treat it as directional until final IRS guidance is published.`
          : `${taxYear()} uses finalized federal bracket, deduction, payroll, and contribution-limit figures in this app.`}
      </p>
    </section>
  );
}
