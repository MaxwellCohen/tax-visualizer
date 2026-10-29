import { getStateYearValues } from "~/lib/config/states/index";
import { calculateAllConfigValues, calculatedConfigValuesById } from "~/lib/tax/calc/calculateTaxes";
import { clampTaxFormData } from "~/lib/tax/calc/clamp";
import { scheduleFor } from "~/lib/tax/calc/stateIncomeTax";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { FederalTaxBracket } from "~/lib/tax/data/types";
import type { ResidenceState } from "~/lib/tax/form/types";
import { scenarioShareUrl } from "~/lib/tax/scenario/readableParams";
import {
  scenarioInputToTaxFormData,
  validateScenarioInput,
  type ScenarioInput,
} from "~/lib/tax/scenario/scenarioInput";

export type ScenarioSummary = {
  input: ScenarioInput;
  /** Annual USD. */
  grossIncome: number;
  preTaxDeductions: number;
  adjustedGrossIncome: number;
  deduction: { type: "standard" | "itemized"; amount: number };
  taxableIncome: number;
  federalIncomeTax: number;
  federalCreditsApplied: number;
  stateIncomeTax: number;
  stateTaxableIncome: number;
  payrollTaxes: {
    socialSecurity: number;
    medicare: number;
    selfEmployment: number;
    total: number;
  };
  totalTax: number;
  takeHomePay: number;
  rates: {
    /** (federal + state income tax) / gross income — matches the app's headline rate. */
    effectiveIncomeTaxRate: number;
    /** All modeled taxes (income + payroll + SE) / gross income. */
    effectiveTotalTaxRate: number;
    /** Statutory federal ordinary bracket rate on the next dollar of ordinary taxable income. */
    federalMarginalRate: number;
    /** Statutory state bracket rate on the next dollar of state taxable income. */
    stateMarginalRate: number;
  };
  /** Relative app link with readable query params that reproduces this scenario. */
  shareUrl: string;
  warnings: string[];
};

export type CalculateScenarioResult =
  | { ok: true; value: ScenarioSummary }
  | { ok: false; errors: string[] };

function federalMarginalRate(brackets: FederalTaxBracket[], ordinaryTaxable: number): number {
  if (ordinaryTaxable <= 0) return 0;
  return brackets.find((b) => b.upTo === null || ordinaryTaxable < b.upTo)?.rate ?? 0;
}

function stateMarginalRate(input: ScenarioInput, state: ResidenceState, stateTaxable: number): number {
  if (state === "none" || stateTaxable <= 0) return 0;
  const entry = getStateYearValues(input.year)?.[state];
  if (!entry) return 0;
  let rate = 0;
  for (const [over, r] of scheduleFor(entry, input.filingStatus)) {
    if (stateTaxable > over) rate = r;
  }
  return rate;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** Run a validated scenario through the same `calculateAllConfigValues` pipeline as the UI. */
function summarizeScenario(input: ScenarioInput): ScenarioSummary {
  const taxData = getTaxYearConfig(input.year);
  if (!taxData) throw new Error(`Unsupported tax year ${input.year}`);
  const formData = scenarioInputToTaxFormData(input);
  const clamped = clampTaxFormData(formData);
  const warnings: string[] = [];
  clamped.rows.forEach((row, i) => {
    const before = formData.rows[i];
    if (row.type !== "setting" && before?.type !== "setting" && before && row.amount !== before.amount) {
      warnings.push(`${row.kind} capped to ${row.amount} by combined year limits.`);
    }
  });

  const values = calculatedConfigValuesById(
    calculateAllConfigValues(clamped, taxData, input.filingStatus),
  );
  const v = (id: string) => values.get(id) ?? 0;

  const grossIncome = v("totalIncome");
  const adjustedGrossIncome = Math.max(0, v("wages") + v("longTermCapGains") - v("mekkoSelfEmploymentTaxDeduction"));
  const socialSecurity = v("socialSecurityTax");
  const medicare = v("medicareTax");
  const selfEmployment = v("selfEmploymentTax");
  const payrollTotal = socialSecurity + medicare + selfEmployment;
  const federalIncomeTax = v("federalIncomeTax");
  const stateIncomeTax = v("stateIncomeTax");
  const totalTax = federalIncomeTax + stateIncomeTax + payrollTotal;

  return {
    input,
    grossIncome: round2(grossIncome),
    preTaxDeductions: round2(v("pretaxDeductions")),
    adjustedGrossIncome: round2(adjustedGrossIncome),
    deduction: {
      type: input.itemize ? "itemized" : "standard",
      amount: round2(v("mekkoDeductionShieldNet")),
    },
    taxableIncome: round2(v("taxableIncome")),
    federalIncomeTax: round2(federalIncomeTax),
    federalCreditsApplied: round2(v("federalTaxCreditsApplied")),
    stateIncomeTax: round2(stateIncomeTax),
    stateTaxableIncome: round2(v("stateTaxableIncome")),
    payrollTaxes: {
      socialSecurity: round2(socialSecurity),
      medicare: round2(medicare),
      selfEmployment: round2(selfEmployment),
      total: round2(payrollTotal),
    },
    totalTax: round2(totalTax),
    takeHomePay: round2(v("takeHomePay")),
    rates: {
      effectiveIncomeTaxRate: round4(v("effectiveTaxRate")),
      effectiveTotalTaxRate: round4(grossIncome > 0 ? totalTax / grossIncome : 0),
      federalMarginalRate: federalMarginalRate(
        taxData.federalBrackets[input.filingStatus],
        v("ordinaryTaxableIncome"),
      ),
      stateMarginalRate: stateMarginalRate(input, input.state, v("stateTaxableIncome")),
    },
    shareUrl: scenarioShareUrl(input),
    warnings,
  };
}

/** Validate untrusted input (e.g. a JSON request body) and summarize it. */
export function calculateScenario(raw: unknown): CalculateScenarioResult {
  const validated = validateScenarioInput(raw);
  if (!validated.ok) return validated;
  return { ok: true, value: summarizeScenario(validated.value) };
}
