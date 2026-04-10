import { createEffect, createMemo, createSignal, Index, Show } from "solid-js";
import { createForm } from "@tanstack/solid-form";
import Accordion from "~/components/Accordion";
import {
  getPretaxLimits,
  getTaxYearConfig,
  isPlanningTaxYear,
  type FilingStatus,
} from "~/lib/taxData";
import {
  incomeSourceDisplayLabel,
  type IncomeKind,
  newIncomeSource,
  type TaxInput,
} from "~/lib/taxCalc";

type TaxInputFormProps = {
  value: TaxInput;
  availableYears: number[];
  onChange: (nextValue: TaxInput) => void;
};

const filingStatusOptions: Array<{ value: FilingStatus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married filing jointly" },
  { value: "marriedSeparate", label: "Married filing separately" },
  { value: "headOfHousehold", label: "Head of household" },
];

const incomeKindOptions: Array<{ value: IncomeKind; label: string }> = [
  { value: "wages", label: "W-2 wages" },
  { value: "ordinary", label: "Other ordinary income" },
  { value: "shortTermCapGains", label: "Short-term capital gains" },
  { value: "longTermCapGains", label: "Long-term capital gains" },
];

function parseCurrencyInput(rawValue: string): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function clampToMax(value: number, max: number): number {
  if (!Number.isFinite(max) || max < 0) return Math.max(0, value);
  return Math.min(Math.max(0, value), max);
}

const inputClass =
  "w-full rounded-md border-0 px-3 py-2.5 text-sm outline-none transition-shadow duration-150 focus:ring-2 focus:ring-[var(--accent)]";
const labelClass = "flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function labelForIncomeKind(kind: IncomeKind): string {
  return incomeKindOptions.find(o => o.value === kind)?.label ?? kind;
}

export default function TaxInputForm(props: TaxInputFormProps) {
  const form = createForm(() => ({
    defaultValues: props.value,
    listeners: {
      onChange: ({ formApi }) => {
        props.onChange(formApi.state.values);
      },
    },
  }));

  const values = form.useStore(s => s.values);

  const addSource = () => {
    form.pushFieldValue("incomeSources", newIncomeSource({ kind: "ordinary" }));
  };

  const removeSourceAt = (index: number) => {
    if (values().incomeSources.length <= 1) return;
    void form.removeFieldValue("incomeSources", index);
  };

  const wageSourceIndices = createMemo(() =>
    values()
      .incomeSources.map((s, i) => (s.kind === "wages" ? i : -1))
      .filter(i => i >= 0),
  );

  const otherSourceIndices = createMemo(() =>
    values()
      .incomeSources.map((s, i) => (s.kind !== "wages" ? i : -1))
      .filter(i => i >= 0),
  );

  const wagesTotal = createMemo(() =>
    values()
      .incomeSources.filter(s => s.kind === "wages")
      .reduce((sum, s) => sum + s.amount, 0),
  );
  const selectedTaxConfig = createMemo(() => getTaxYearConfig(values().taxYear));
  const pretaxLimits = createMemo(() => getPretaxLimits(values().taxYear));
  const isMarriedJoint = createMemo(() => values().filingStatus === "marriedJoint");
  const preTaxBenefitsTotal = createMemo(() => {
    const v = values();
    const j = v.filingStatus === "marriedJoint";
    const k401 = v.preTax401kSpouse1 + (j ? v.preTax401kSpouse2 : 0);
    const hsa = v.preTaxHsaSpouse1 + (j ? v.preTaxHsaSpouse2 : 0);
    return k401 + hsa + v.preTaxOther;
  });

  const maxElective401 = createMemo(() => pretaxLimits()?.electiveDeferral401k);
  const maxIraContribution = createMemo(() => pretaxLimits()?.traditionalIraContribution);
  const maxHsaSpouse1 = createMemo(() => {
    const lim = pretaxLimits();
    if (!lim) return undefined;
    if (!isMarriedJoint()) return lim.hsaFamily;
    return Math.max(0, lim.hsaFamily - values().preTaxHsaSpouse2);
  });
  const maxHsaSpouse2 = createMemo(() => {
    const lim = pretaxLimits();
    if (!lim || !isMarriedJoint()) return undefined;
    return Math.max(0, lim.hsaFamily - values().preTaxHsaSpouse1);
  });

  createEffect(() => {
    const lim = pretaxLimits();
    if (!lim) return;
    const v = values();
    const cap = lim.electiveDeferral401k;
    const j = v.filingStatus === "marriedJoint";

    const p1 = Math.min(v.preTax401kSpouse1, cap);
    if (p1 !== v.preTax401kSpouse1) {
      form.setFieldValue("preTax401kSpouse1", p1);
    }

    if (j) {
      const p2 = Math.min(v.preTax401kSpouse2, cap);
      if (p2 !== v.preTax401kSpouse2) {
        form.setFieldValue("preTax401kSpouse2", p2);
      }
      let h1 = Math.min(v.preTaxHsaSpouse1, lim.hsaFamily);
      let h2 = Math.min(v.preTaxHsaSpouse2, Math.max(0, lim.hsaFamily - h1));
      if (h1 !== v.preTaxHsaSpouse1) {
        form.setFieldValue("preTaxHsaSpouse1", h1);
      }
      if (h2 !== v.preTaxHsaSpouse2) {
        form.setFieldValue("preTaxHsaSpouse2", h2);
      }
    } else {
      const h1 = Math.min(v.preTaxHsaSpouse1, lim.hsaFamily);
      if (h1 !== v.preTaxHsaSpouse1) {
        form.setFieldValue("preTaxHsaSpouse1", h1);
      }
      if (v.preTax401kSpouse2 !== 0) {
        form.setFieldValue("preTax401kSpouse2", 0);
      }
      if (v.preTaxHsaSpouse2 !== 0) {
        form.setFieldValue("preTaxHsaSpouse2", 0);
      }
    }

    const iraCap = lim.traditionalIraContribution;
    const ir1 = Math.min(v.traditionalIraSpouse1, iraCap);
    if (ir1 !== v.traditionalIraSpouse1) {
      form.setFieldValue("traditionalIraSpouse1", ir1);
    }
    if (j) {
      const ir2 = Math.min(v.traditionalIraSpouse2, iraCap);
      if (ir2 !== v.traditionalIraSpouse2) {
        form.setFieldValue("traditionalIraSpouse2", ir2);
      }
    } else if (v.traditionalIraSpouse2 !== 0) {
      form.setFieldValue("traditionalIraSpouse2", 0);
    }
  });

  const standardDeduction = createMemo(
    () => selectedTaxConfig()?.standardDeduction[values().filingStatus] ?? 0,
  );
  const itemizedBeatsStandard = createMemo(
    () => values().itemizedDeductions >= standardDeduction(),
  );

  const [wagesSectionOpen, setWagesSectionOpen] = createSignal(true);
  const [preTaxBenefitsOpen, setPreTaxBenefitsOpen] = createSignal(true);

  const renderIncomeSourceFields = (index: number) => (
    <div class="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)_auto]">
      <form.Field name={`incomeSources[${index}].kind`}>
        {field => (
          <label class={labelClass} style={{ color: "var(--text-muted)" }}>
            Type
            <select
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              value={field().state.value}
              onChange={e => field().handleChange(e.currentTarget.value as IncomeKind)}
              onBlur={field().handleBlur}
            >
              {incomeKindOptions.map(opt => (
                <option value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        )}
      </form.Field>
      <form.Field name={`incomeSources[${index}].label`}>
        {field => (
          <label class={labelClass} style={{ color: "var(--text-muted)" }}>
            Label (optional)
            <input
              type="text"
              placeholder="e.g. Employer, Brokerage"
              class={inputClass}
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              value={field().state.value}
              onInput={e => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
            />
          </label>
        )}
      </form.Field>
      <form.Field name={`incomeSources[${index}].amount`}>
        {field => (
          <label class={labelClass} style={{ color: "var(--text-muted)" }}>
            Amount
            <input
              type="number"
              min="0"
              step="1"
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
      </form.Field>
      <div class="flex items-end justify-end pb-0.5">
        <button
          type="button"
          class="rounded-md px-2.5 py-2 text-xs font-medium"
          style={{
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
          disabled={values().incomeSources.length <= 1}
          title={
            values().incomeSources.length <= 1
              ? "Keep at least one row"
              : "Remove this source"
          }
          onClick={() => removeSourceAt(index)}
        >
          Remove
        </button>
      </div>
    </div>
  );

  return (
    <form
      class="space-y-8 rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <section class="space-y-4">
        <h2
          class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
        >
          Filing Details
        </h2>
        <div class="grid gap-4 md:grid-cols-2">
          <form.Field name="taxYear">
            {field => (
              <label class={labelClass} style={{ color: "var(--text-muted)" }}>
                Tax Year
                <select
                  class={inputClass}
                  style={{ background: "var(--input-bg)", color: "var(--text)" }}
                  value={field().state.value}
                  onChange={e => field().handleChange(Number(e.currentTarget.value))}
                  onBlur={field().handleBlur}
                >
                  {props.availableYears.map(year => (
                    <option value={year}>{year}</option>
                  ))}
                </select>
              </label>
            )}
          </form.Field>

          <form.Field name="filingStatus">
            {field => (
              <label class={labelClass} style={{ color: "var(--text-muted)" }}>
                Filing Status
                <select
                  class={inputClass}
                  style={{ background: "var(--input-bg)", color: "var(--text)" }}
                  value={field().state.value}
                  onChange={e =>
                    field().handleChange(e.currentTarget.value as FilingStatus)
                  }
                  onBlur={field().handleBlur}
                >
                  {filingStatusOptions.map(option => (
                    <option value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            )}
          </form.Field>
        </div>
        <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {isPlanningTaxYear(values().taxYear)
            ? `${values().taxYear} uses planning figures for inflation-adjusted federal tax data and contribution caps. Treat it as directional until final IRS guidance is published.`
            : `${values().taxYear} uses finalized federal bracket, deduction, payroll, and contribution-limit figures in this app.`}
        </p>
      </section>

      <section class="space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <h2
            class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
          >
            Income Sources
          </h2>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
              border: "1px solid var(--border)",
            }}
            onClick={addSource}
          >
            Add source
          </button>
        </div>
        <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Short-term gains are taxed as ordinary income. Long-term gains use 0% / 15% / 20% rates stacked on
          your ordinary taxable income. Payroll tax applies only to W-2 wages lines.
        </p>
        <div class="space-y-6">
          <Accordion
            open={wagesSectionOpen()}
            onOpenChange={setWagesSectionOpen}
            summary={
              <>
                <h2
                  class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
                >
                  W-2 wages
                </h2>
                <span class="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {money.format(wagesTotal())}
                </span>
              </>
            }
            action={wagesSectionOpen() ? "Collapse" : "Edit"}
            bodyClass="space-y-3"
          >
            <Index each={wageSourceIndices()}>
              {srcIndex => (
                <div
                  class="rounded-lg p-3"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {renderIncomeSourceFields(srcIndex()!)}
                </div>
              )}
            </Index>
          </Accordion>

          <div class="space-y-3">
            <Index each={otherSourceIndices()}>
              {srcIndex => {
                const i = () => srcIndex()!;
                const source = () => values().incomeSources[i()];
                return (
                  <Accordion
                    summary={
                      <>
                        <h2
                          class="min-w-0 truncate text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
                          style={{
                            color: "var(--text-faint)",
                            "font-family": "var(--font-heading)",
                          }}
                        >
                          {incomeSourceDisplayLabel(source())}
                        </h2>
                        <Show
                          when={
                            incomeSourceDisplayLabel(source()) !==
                            labelForIncomeKind(source().kind)
                          }
                        >
                          <span
                            class="text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {labelForIncomeKind(source().kind)}
                          </span>
                        </Show>
                        <span class="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {money.format(source().amount)}
                        </span>
                      </>
                    }
                    action="Edit"
                  >
                    {renderIncomeSourceFields(i())}
                  </Accordion>
                );
              }}
            </Index>
          </div>
        </div>
      </section>

      <Accordion
        open={preTaxBenefitsOpen()}
        onOpenChange={setPreTaxBenefitsOpen}
        summary={
          <>
            <h2
              class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
            >
              Pre-tax benefits
            </h2>
            <span class="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
              {money.format(preTaxBenefitsTotal())}
            </span>
          </>
        }
        action={preTaxBenefitsOpen() ? "Collapse" : "Edit"}
        bodyClass="space-y-4"
      >
        <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Payroll amounts that come out before tax. Applied only to W-2 wages; totals above your wage income
          are scaled down. 401(k)/403(b) reduces federal income tax on wages but not Social Security/Medicare
          here; HSA and other lines also reduce payroll tax. With married filing jointly, 401(k) limits are per
          spouse; HSA family coverage uses a combined cap on payroll contributions. Entries here cannot exceed
          the IRS contribution limits for the selected tax year (age-50+ catch-up is not modeled). Those
          limits update when you change tax year.
        </p>
        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <form.Field name="preTax401kSpouse1">
              {field => (
                <label class={labelClass} style={{ color: "var(--text-muted)" }}>
                  401(k) / 403(b) — {isMarriedJoint() ? "Spouse 1" : "Deferrals"}
                  <input
                    type="number"
                    min="0"
                    max={maxElective401()}
                    step="100"
                    class={inputClass}
                    style={{ background: "var(--input-bg)", color: "var(--text)" }}
                    value={field().state.value}
                    onInput={e =>
                      field().handleChange(
                        clampToMax(
                          parseCurrencyInput(e.currentTarget.value),
                          maxElective401() ?? Number.POSITIVE_INFINITY,
                        ),
                      )
                    }
                    onBlur={field().handleBlur}
                  />
                  <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                    Max {values().taxYear} elective deferral (modeled):{" "}
                    {money.format(pretaxLimits()?.electiveDeferral401k ?? 0)}
                    {isMarriedJoint() ? " per spouse" : ""}.
                  </span>
                </label>
              )}
            </form.Field>
            <Show when={isMarriedJoint()}>
              <form.Field name="preTax401kSpouse2">
                {field => (
                  <label class={labelClass} style={{ color: "var(--text-muted)" }}>
                    401(k) / 403(b) — Spouse 2
                    <input
                      type="number"
                      min="0"
                      max={maxElective401()}
                      step="100"
                      class={inputClass}
                      style={{ background: "var(--input-bg)", color: "var(--text)" }}
                      value={field().state.value}
                      onInput={e =>
                        field().handleChange(
                          clampToMax(
                            parseCurrencyInput(e.currentTarget.value),
                            maxElective401() ?? Number.POSITIVE_INFINITY,
                          ),
                        )
                      }
                      onBlur={field().handleBlur}
                    />
                    <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                      Same per-spouse max:{" "}
                      {money.format(pretaxLimits()?.electiveDeferral401k ?? 0)}.
                    </span>
                  </label>
                )}
              </form.Field>
            </Show>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <form.Field name="preTaxHsaSpouse1">
              {field => (
                <label class={labelClass} style={{ color: "var(--text-muted)" }}>
                  HSA (payroll) — {isMarriedJoint() ? "Spouse 1" : "Total"}
                  <input
                    type="number"
                    min="0"
                    max={maxHsaSpouse1()}
                    step="50"
                    class={inputClass}
                    style={{ background: "var(--input-bg)", color: "var(--text)" }}
                    value={field().state.value}
                    onInput={e =>
                      field().handleChange(
                        clampToMax(
                          parseCurrencyInput(e.currentTarget.value),
                          maxHsaSpouse1() ?? Number.POSITIVE_INFINITY,
                        ),
                      )
                    }
                    onBlur={field().handleBlur}
                  />
                  <Show
                    when={isMarriedJoint()}
                    fallback={
                      <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                        Typical {values().taxYear}: {money.format(pretaxLimits()?.hsaSelfOnly ?? 0)}{" "}
                        self-only HDHP / {money.format(pretaxLimits()?.hsaFamily ?? 0)} family HDHP (combined
                        contributions).
                      </span>
                    }
                  >
                    <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                      Family HDHP combined payroll cap (typ. {values().taxYear}):{" "}
                      {money.format(pretaxLimits()?.hsaFamily ?? 0)}. Self-only HDHP: up to{" "}
                      {money.format(pretaxLimits()?.hsaSelfOnly ?? 0)} per spouse.
                    </span>
                  </Show>
                </label>
              )}
            </form.Field>
            <Show when={isMarriedJoint()}>
              <form.Field name="preTaxHsaSpouse2">
                {field => (
                  <label class={labelClass} style={{ color: "var(--text-muted)" }}>
                    HSA (payroll) — Spouse 2
                    <input
                      type="number"
                      min="0"
                      max={maxHsaSpouse2()}
                      step="50"
                      class={inputClass}
                      style={{ background: "var(--input-bg)", color: "var(--text)" }}
                      value={field().state.value}
                      onInput={e =>
                        field().handleChange(
                          clampToMax(
                            parseCurrencyInput(e.currentTarget.value),
                            maxHsaSpouse2() ?? Number.POSITIVE_INFINITY,
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
              </form.Field>
            </Show>
          </div>

          <form.Field name="preTaxOther">
            {field => (
              <label class={`${labelClass} md:max-w-md`} style={{ color: "var(--text-muted)" }}>
                Other (FSA, transit, etc.)
                <input
                  type="number"
                  min="0"
                  step="50"
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
          </form.Field>

          <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <strong class="font-medium" style={{ color: "var(--text)" }}>
              Traditional IRA (deductible)
            </strong>{" "}
            — not withheld from pay; reduces federal ordinary income only (not Social Security or Medicare
            here). Modeled as fully deductible up to the IRS contribution cap per person for the selected
            year; workplace-plan MAGI phase-outs are omitted.
          </p>
          <div class="grid gap-4 md:grid-cols-2">
            <form.Field name="traditionalIraSpouse1">
              {field => (
                <label class={labelClass} style={{ color: "var(--text-muted)" }}>
                  Traditional IRA — {isMarriedJoint() ? "Spouse 1" : "Contribution"}
                  <input
                    type="number"
                    min="0"
                    max={maxIraContribution()}
                    step="100"
                    class={inputClass}
                    style={{ background: "var(--input-bg)", color: "var(--text)" }}
                    value={field().state.value}
                    onInput={e =>
                      field().handleChange(
                        clampToMax(
                          parseCurrencyInput(e.currentTarget.value),
                          maxIraContribution() ?? Number.POSITIVE_INFINITY,
                        ),
                      )
                    }
                    onBlur={field().handleBlur}
                  />
                  <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                    Max {values().taxYear} (modeled, under age 50):{" "}
                    {money.format(pretaxLimits()?.traditionalIraContribution ?? 0)}
                    {isMarriedJoint() ? " per spouse" : ""}.
                  </span>
                </label>
              )}
            </form.Field>
            <Show when={isMarriedJoint()}>
              <form.Field name="traditionalIraSpouse2">
                {field => (
                  <label class={labelClass} style={{ color: "var(--text-muted)" }}>
                    Traditional IRA — Spouse 2
                    <input
                      type="number"
                      min="0"
                      max={maxIraContribution()}
                      step="100"
                      class={inputClass}
                      style={{ background: "var(--input-bg)", color: "var(--text)" }}
                      value={field().state.value}
                      onInput={e =>
                        field().handleChange(
                          clampToMax(
                            parseCurrencyInput(e.currentTarget.value),
                            maxIraContribution() ?? Number.POSITIVE_INFINITY,
                          ),
                        )
                      }
                      onBlur={field().handleBlur}
                    />
                    <span class="text-[0.65rem] font-normal normal-case tracking-normal">
                      Same per-spouse cap:{" "}
                      {money.format(pretaxLimits()?.traditionalIraContribution ?? 0)}.
                    </span>
                  </label>
                )}
              </form.Field>
            </Show>
          </div>
        </div>
      </Accordion>

      <section class="space-y-4">
        <h2
          class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
        >
          Deductions
        </h2>
        <form.Field name="useItemizedDeductions">
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
        </form.Field>
        <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Standard deduction for this year and filing status: {money.format(standardDeduction())}.
        </p>

        <Show when={values().useItemizedDeductions}>
          <>
            <form.Field name="itemizedDeductions">
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
            </form.Field>
            <p
              class="rounded-lg px-3 py-2 text-xs leading-relaxed"
              style={{
                background: itemizedBeatsStandard() ? "var(--accent-muted)" : "var(--warning-bg)",
                color: itemizedBeatsStandard() ? "var(--accent)" : "var(--warning-text)",
                border: `1px solid ${itemizedBeatsStandard() ? "var(--border)" : "var(--warning-border)"}`,
              }}
            >
              {itemizedBeatsStandard()
                ? `Itemized deductions currently exceed the standard deduction by ${money.format(values().itemizedDeductions - standardDeduction())}.`
                : `Itemized deductions are currently ${money.format(standardDeduction() - values().itemizedDeductions)} below the standard deduction, so the standard deduction would usually produce a lower federal tax bill.`}
            </p>
          </>
        </Show>
      </section>
    </form>
  );
}
