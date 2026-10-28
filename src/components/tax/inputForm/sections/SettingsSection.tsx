import { Show, createMemo, type Accessor, type Setter } from "solid-js";
import { getTaxYearFromRows } from "~/lib/tax/calc/inputs";
import { settingRowIndex } from "~/lib/tax/form/rows";
import type { ResidenceState, TaxFormData, TaxFormRow } from "~/lib/tax/form/types";
import type { FilingStatus } from "~/lib/tax/data/types";
import { isPlanningTaxYear } from "~/lib/tax/data/accessors.impl";
import { getResidenceStateFromRows } from "~/lib/tax/calc/scenarioMetrics";
import { getStateYearValues, STATE_NAMES } from "~/lib/config/states/index";
import { filingStatusOptions, residenceStateOptions } from "~/components/tax/inputForm/shared";
import { FormStyledSelect } from "~/components/tax/inputForm/controls/FormStyledSelect";
import { FormIntegerInput } from "~/components/tax/inputForm/controls/FormIntegerInput";

type Props = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  availableYears: number[];
};

function patchSettingRow<V extends number | FilingStatus | ResidenceState>(
  rows: TaxFormRow[],
  id: "taxYear" | "filingStatus" | "residenceState" | "qualifyingChildren" | "otherDependents",
  value: V,
): TaxFormRow[] {
  const i = settingRowIndex(rows, id);
  if (i < 0 && (id === "residenceState" || id === "qualifyingChildren" || id === "otherDependents")) {
    const insertAfterId = id === "otherDependents" ? "qualifyingChildren" : "filingStatus";
    const insertAfterIndex = settingRowIndex(rows, insertAfterId);
    const insertAt = insertAfterIndex >= 0 ? insertAfterIndex + 1 : 2;
    const next = [...rows];
    next.splice(insertAt, 0, { type: "setting", id, value } as TaxFormRow);
    return next;
  }
  if (i < 0) return rows;
  const r = rows[i];
  if (r.type !== "setting" || r.id !== id) return rows;
  const next = [...rows];
  next[i] = { ...r, value } as TaxFormRow;
  return next;
}

function stateTaxNote(state: Exclude<ResidenceState, "none">, taxYear: number): string {
  const name = STATE_NAMES[state];
  const yearValues = getStateYearValues(taxYear);
  if (!yearValues) return `${name} income tax is not modeled for ${taxYear}.`;
  if (!yearValues[state]) return `${name} has no broad-based income tax on wages in ${taxYear}.`;
  return `${name} income tax uses state brackets on federal AGI after the state standard deduction and flat exemptions. Phaseouts, state credits, and local income taxes are not modeled.`;
}

export function SettingsSection(props: Props) {
  const taxYearIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "taxYear"));
  const filingIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "filingStatus"));
  const qualifyingChildrenIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "qualifyingChildren"));
  const otherDependentsIdx = createMemo(() => settingRowIndex(props.taxInput().rows, "otherDependents"));
  const taxYear = createMemo(() => getTaxYearFromRows(props.taxInput().rows));
  const residenceState = createMemo(() => getResidenceStateFromRows(props.taxInput().rows));
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
      <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
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

        <FormStyledSelect
          label="State"
          value={() => residenceState()}
          onInput={(e) => {
            const state = e.currentTarget.value as ResidenceState;
            props.setTaxInput((prev) => ({ ...prev, rows: patchSettingRow(prev.rows, "residenceState", state) }));
          }}
          onBlur={() => {}}
          options={residenceStateOptions}
        />

        <label class="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide">
          Qualifying children
          <FormIntegerInput
            value={qualifyingChildrenValue()}
            onInput={(value) => {
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchSettingRow(prev.rows, "qualifyingChildren", value),
              }));
            }}
            ariaLabel="Qualifying children"
          />
        </label>

        <label class="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide">
          Other dependents
          <FormIntegerInput
            value={otherDependentsValue()}
            onInput={(value) => {
              props.setTaxInput((prev) => ({
                ...prev,
                rows: patchSettingRow(prev.rows, "otherDependents", value),
              }));
            }}
            ariaLabel="Other dependents"
          />
        </label>
      </div>
      <p class="text-xs leading-relaxed text-muted-foreground">
        {isPlanningTaxYear(taxYear())
          ? `${taxYear()} uses planning figures for inflation-adjusted federal tax data and contribution caps. Treat it as directional until final IRS guidance is published.`
          : `${taxYear()} uses finalized federal bracket, deduction, payroll, and contribution-limit figures in this app.`}
      </p>
      <Show when={residenceState() !== "none" ? residenceState() : undefined}>
        {(state) => (
          <p class="text-xs leading-relaxed text-muted-foreground">
            {stateTaxNote(state() as Exclude<ResidenceState, "none">, taxYear())}
          </p>
        )}
      </Show>
    </section>
  );
}
