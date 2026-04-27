import { createMemo, type Accessor, type Setter } from "solid-js";
import { getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { settingRowIndex } from "~/lib/taxForm.rows";
import type { TaxFormData, TaxFormRow } from "~/lib/taxForm.types";
import type { FilingStatus } from "~/lib/taxData";
import { isPlanningTaxYear } from "~/lib/taxData";
import { filingStatusOptions } from "~/components/taxInputForm/shared";
import { FormStyledSelect } from "~/components/taxInputForm/FormStyledSelect";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  availableYears: number[];
};

function patchSettingRow<V extends number | FilingStatus>(
  rows: TaxFormRow[],
  id: "taxYear" | "filingStatus",
  value: V,
): TaxFormRow[] {
  const i = settingRowIndex(rows, id);
  if (i < 0) return rows;
  const r = rows[i];
  if (r.type !== "setting" || r.id !== id) return rows;
  const next = [...rows];
  next[i] = { ...r, value } as TaxFormRow;
  return next;
}

export function TaxInputFormSettingsSection(props: Props) {
  const taxYearIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "taxYear"));
  const filingIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "filingStatus"));
  const taxYear = createMemo(() => getTaxYearFromRows(props.taxInput().rows));
  const taxYearOptions = createMemo(() =>
    props.availableYears.map((year) => ({ value: year, label: String(year) })),
  );

  const taxYearValue = () => {
    const r = props.taxInput().rows[taxYearIdx()];
    return r?.type === "setting" && r.id === "taxYear" ? r.value : taxYear();
  };

  const filingValue = () => {
    const r = props.taxInput().rows[filingIdx()];
    return r?.type === "setting" && r.id === "filingStatus" ? r.value : "single";
  };

  return (
    <section class="space-y-4">
      <h2
        class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Settings
      </h2>
      <div class="grid gap-4 md:grid-cols-2">
        <FormStyledSelect
          label="Tax Year"
          value={() => taxYearValue()}
          onChange={(e) => {
            const y = Number(e.currentTarget.value);
            props.setTaxInput((prev) => ({ ...prev, rows: patchSettingRow(prev.rows, "taxYear", y) }));
          }}
          onBlur={() => {}}
          options={taxYearOptions()}
        />

        <FormStyledSelect
          label="Filing Status"
          value={() => filingValue() as FilingStatus}
          onChange={(e) => {
            const fs = e.currentTarget.value as FilingStatus;
            props.setTaxInput((prev) => ({ ...prev, rows: patchSettingRow(prev.rows, "filingStatus", fs) }));
          }}
          onBlur={() => {}}
          options={filingStatusOptions}
        />
      </div>
      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {isPlanningTaxYear(taxYear())
          ? `${taxYear()} uses planning figures for inflation-adjusted federal tax data and contribution caps. Treat it as directional until final IRS guidance is published.`
          : `${taxYear()} uses finalized federal bracket, deduction, payroll, and contribution-limit figures in this app.`}
      </p>
    </section>
  );
}
