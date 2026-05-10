import { createMemo, type Accessor, type Setter } from "solid-js";
import { getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { settingRowIndex } from "~/lib/taxForm.rows";
import type { TaxFormData, TaxFormRow } from "~/lib/taxForm.types";
import type { FilingStatus } from "~/lib/taxData.types";
import { isPlanningTaxYear } from "~/lib/taxData.accessors.impl";
import { filingStatusOptions } from "~/components/taxInputForm/shared";
import { FormStyledSelect } from "~/components/taxInputForm/controls/FormStyledSelect";
import { FormCurrencyInput } from "~/components/taxInputForm/controls/FormCurrencyInput";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  availableYears: number[];
};

function patchSettingRow<V extends number | FilingStatus>(
  rows: TaxFormRow[],
  id: "taxYear" | "filingStatus" | "qualifyingChildren" | "otherDependents",
  value: V,
): TaxFormRow[] {
  const i = settingRowIndex(rows, id);
  if (i < 0 && (id === "qualifyingChildren" || id === "otherDependents")) {
    const insertAfterId = id === "qualifyingChildren" ? "filingStatus" : "qualifyingChildren";
    const insertAfterIndex = settingRowIndex(rows, insertAfterId);
    const insertAt = insertAfterIndex >= 0 ? insertAfterIndex + 1 : 2;
    const next = [...rows];
    next.splice(insertAt, 0, { type: "setting", id, value: value as number });
    return next;
  }
  if (i < 0) return rows;
  const r = rows[i];
  if (r.type !== "setting" || r.id !== id) return rows;
  const next = [...rows];
  next[i] = { ...r, value } as TaxFormRow;
  return next;
}

export function SettingsSection(props: Props) {
  const taxYearIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "taxYear"));
  const filingIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "filingStatus"));
  const qualifyingChildrenIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "qualifyingChildren"));
  const otherDependentsIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "otherDependents"));
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

  const qualifyingChildrenValue = () => {
    const r = props.taxInput().rows[qualifyingChildrenIdx()];
    return r?.type === "setting" && r.id === "qualifyingChildren" ? r.value : 0;
  };

  const otherDependentsValue = () => {
    const r = props.taxInput().rows[otherDependentsIdx()];
    return r?.type === "setting" && r.id === "otherDependents" ? r.value : 0;
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
          onInput={(e) => {
            const y = Number(e.currentTarget.value);
            props.setTaxInput((prev) => ({ ...prev, rows: patchSettingRow(prev.rows, "taxYear", y) }));
          }}
          onBlur={() => {}}
          options={taxYearOptions()}
        />

        <FormStyledSelect
          label="Filing Status"
          value={() => filingValue() as FilingStatus}
          onInput={(e) => {
            const fs = e.currentTarget.value as FilingStatus;
            props.setTaxInput((prev) => ({ ...prev, rows: patchSettingRow(prev.rows, "filingStatus", fs) }));
          }}
          onBlur={() => {}}
          options={filingStatusOptions}
        />

        <label class="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide">
          Qualifying children
          <FormCurrencyInput
            value={qualifyingChildrenValue()}
            onInput={(value) => {
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchSettingRow(prev.rows, "qualifyingChildren", Math.floor(value)),
              }));
            }}
            onBlur={() => {}}
            ariaLabel="Qualifying children"
          />
        </label>

        <label class="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide">
          Other dependents
          <FormCurrencyInput
            value={otherDependentsValue()}
            onInput={(value) => {
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchSettingRow(prev.rows, "otherDependents", Math.floor(value)),
              }));
            }}
            onBlur={() => {}}
            ariaLabel="Other dependents"
          />
        </label>
      </div>
      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {isPlanningTaxYear(taxYear())
          ? `${taxYear()} uses planning figures for inflation-adjusted federal tax data and contribution caps. Treat it as directional until final IRS guidance is published.`
          : `${taxYear()} uses finalized federal bracket, deduction, payroll, and contribution-limit figures in this app.`}
      </p>
    </section>
  );
}
