import { describe, expect, it } from "vitest";
import {
  calculatePayrollTax,
  calculateSelfEmploymentTax,
  calculateTaxBuckets,
} from "~/lib/config/taxPage/calc/taxCalculations";
import { allPretax, totalIncome } from "~/lib/config/taxPage/rowMetrics";
import { calculateAllConfigValues } from "~/lib/tax/calc/calculateTaxes";
import { newIncomeSource } from "~/lib/tax/calc/labeledAmountSource";
import {
  emptyAggregatedPretax,
  pretaxScalarsToMinimalSources,
} from "~/lib/tax/calc/pretaxBenefitSource";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { FilingStatus } from "~/lib/tax/data/types";
import {
  incomeSourcesToRows,
  newCreditRow,
  newDeductionRow,
  pretaxSourcesToRows,
  taxFormDataFromParts,
} from "~/lib/tax/form/factories";
import type { TaxFormData, TaxFormRow } from "~/lib/tax/form/types";
import { SCENARIO_PRESETS } from "~/lib/tax/scenario/presets.constants";

type TakeHomeGolden = {
  takeHome: number;
  federalIncomeTax?: number;
  payrollTax?: number;
};

type TakeHomeScenario = {
  name: string;
  taxYear: number;
  filingStatus: FilingStatus;
  buildForm: () => TaxFormData;
  golden?: TakeHomeGolden;
};

function presetForm(presetId: string, taxYear: number): TaxFormData {
  const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error(`Unknown preset: ${presetId}`);
  return preset.buildInput(taxYear);
}

function configValue(
  cc: ReturnType<typeof calculateAllConfigValues>,
  id: string,
): number {
  return cc.find((c) => c.id === id)?.computedValue ?? 0;
}

function expectedTakeHomeDirect(
  rows: TaxFormRow[],
  taxData: NonNullable<ReturnType<typeof getTaxYearConfig>>,
  filingStatus: FilingStatus,
): number {
  const gross = totalIncome(rows);
  const pretax = allPretax(rows);
  const federalTax = calculateTaxBuckets(rows, taxData, filingStatus).reduce(
    (sum, bracket) => sum + bracket.tax,
    0,
  );
  const payroll =
    calculatePayrollTax(rows, taxData, filingStatus) +
    calculateSelfEmploymentTax(rows, taxData, filingStatus);
  return gross - pretax - federalTax - payroll;
}

function runScenario(args: {
  taxYear: number;
  filingStatus: FilingStatus;
  form: TaxFormData;
}) {
  const taxData = getTaxYearConfig(args.taxYear);
  if (!taxData) throw new Error(`No tax year config for ${args.taxYear}`);
  const cc = calculateAllConfigValues(args.form, taxData, args.filingStatus);
  return { cc, taxData, rows: args.form.rows };
}

function assertTakeHomeAccurate(
  cc: ReturnType<typeof calculateAllConfigValues>,
  rows: TaxFormRow[],
  taxData: NonNullable<ReturnType<typeof getTaxYearConfig>>,
  filingStatus: FilingStatus,
  golden?: TakeHomeGolden,
) {
  const takeHome = configValue(cc, "takeHomePay");
  const total = configValue(cc, "totalIncome");
  const pretaxDeferrals = configValue(cc, "mekkoPretaxDeferrals");
  const federalIncomeTax = configValue(cc, "federalIncomeTax");
  const payrollTax = configValue(cc, "payrollTax");
  const selfEmploymentTax = configValue(cc, "selfEmploymentTax");

  expect(takeHome).toBe(expectedTakeHomeDirect(rows, taxData, filingStatus));
  expect(takeHome).toBe(
    total - pretaxDeferrals - federalIncomeTax - payrollTax - selfEmploymentTax,
  );
  if (total > 0) {
    expect(takeHome).toBeLessThanOrEqual(total);
  }

  if (golden) {
    expect(takeHome).toBe(golden.takeHome);
    if (golden.federalIncomeTax !== undefined) {
      expect(federalIncomeTax).toBe(golden.federalIncomeTax);
    }
    if (golden.payrollTax !== undefined) {
      expect(payrollTax).toBe(golden.payrollTax);
    }
  }
}

const TAKE_HOME_SCENARIOS: TakeHomeScenario[] = [
  {
    name: "single W-2 $25k",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 25_000, label: "Salary" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
    golden: { takeHome: 22_197.5 },
  },
  {
    name: "single W-2 $90k (preset)",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () => presetForm("singleW2", 2026),
    golden: { takeHome: 72_145 },
  },
  {
    name: "high income payroll + STCG (preset)",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () => presetForm("highIncome", 2026),
  },
  {
    name: "W-2 + LTCG + 401k (preset)",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () => presetForm("w2AndLtcg", 2026),
    golden: { takeHome: 106_700 },
  },
  {
    name: "MFJ $162k one spouse wages",
    taxYear: 2026,
    filingStatus: "marriedJoint",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "marriedJoint",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({
            kind: "income-ordinary-wages-spouse1",
            amount: 162_000,
            label: "Wages",
          }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [newDeductionRow()],
        creditRows: [newCreditRow()],
      }),
    golden: { takeHome: 131_627, federalIncomeTax: 17_980, payrollTax: 12_393 },
  },
  {
    name: "MFJ dual wages $100k + $80k",
    taxYear: 2026,
    filingStatus: "marriedJoint",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "marriedJoint",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({
            kind: "income-ordinary-wages-spouse1",
            amount: 100_000,
            label: "Spouse 1",
          }),
          newIncomeSource({
            kind: "income-ordinary-wages-spouse2",
            amount: 80_000,
            label: "Spouse 2",
          }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "MFJ family benefits (preset)",
    taxYear: 2026,
    filingStatus: "marriedJoint",
    buildForm: () => presetForm("familyBenefits", 2026),
    golden: { takeHome: 120_110 },
  },
  {
    name: "head of household $60k, 1 child",
    taxYear: 2026,
    filingStatus: "headOfHousehold",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "headOfHousehold",
        qualifyingChildren: 1,
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 60_000, label: "Salary" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "married filing separately $75k",
    taxYear: 2026,
    filingStatus: "marriedSeparate",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "marriedSeparate",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 75_000, label: "Salary" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "MFJ $400k wages",
    taxYear: 2026,
    filingStatus: "marriedJoint",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "marriedJoint",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({
            kind: "income-ordinary-wages-spouse1",
            amount: 400_000,
            label: "Wages",
          }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "self-employment $50k only",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({
            kind: "income-ordinary-selfEmployment-selfEmployment-spouse1",
            amount: 50_000,
            label: "1099",
          }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "W-2 $80k + SE $30k",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 80_000, label: "W-2" }),
          newIncomeSource({
            kind: "income-ordinary-selfEmployment-selfEmployment-spouse1",
            amount: 30_000,
            label: "1099",
          }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "single $100k with max elective 401k",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 100_000, label: "Salary" }),
        ]),
        pretaxRows: pretaxSourcesToRows(
          pretaxScalarsToMinimalSources({
            ...emptyAggregatedPretax(),
            preTax401kSpouse1: 24_000,
          }),
        ),
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "itemized SALT + mortgage + charity",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 150_000, label: "Salary" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: true,
        deductionRows: [
          newDeductionRow({
            kind: "deduction-salt-salt",
            amount: 10_000,
            label: "SALT",
          }),
          newDeductionRow({
            kind: "deduction-mortgageInterest-mortgageInterest",
            amount: 15_000,
            label: "Mortgage",
          }),
          newDeductionRow({
            kind: "deduction-charitable-charitable",
            amount: 10_000,
            label: "Charity",
          }),
        ],
        creditRows: [],
      }),
  },
  {
    name: "LTCG-only $40k",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({
            kind: "income-longTermCapGains-longTermCapGains-spouse1",
            amount: 40_000,
            label: "Brokerage",
          }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "zero income",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        incomeRows: [],
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
    golden: { takeHome: 0, federalIncomeTax: 0, payrollTax: 0 },
  },
  {
    name: "single $80k, 2 qualifying children",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        qualifyingChildren: 2,
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 80_000, label: "Salary" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "single $70k, 1 other dependent",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        otherDependents: 1,
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 70_000, label: "Salary" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    name: "single $55k + $2k other federal credit",
    taxYear: 2026,
    filingStatus: "single",
    buildForm: () =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 55_000, label: "Salary" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [
          newCreditRow({
            kind: "input-credit-other-otherFederalCredit",
            amount: 2_000,
            label: "Credit",
          }),
        ],
      }),
  },
  {
    name: "2025 single W-2 $90k",
    taxYear: 2025,
    filingStatus: "single",
    buildForm: () => presetForm("singleW2", 2025),
  },
];

describe("takeHomePay", () => {
  it.each(TAKE_HOME_SCENARIOS)(
    "$name: pipeline matches formula and accounting identity",
    (scenario) => {
      const form = scenario.buildForm();
      const { cc, taxData, rows } = runScenario({
        taxYear: scenario.taxYear,
        filingStatus: scenario.filingStatus,
        form,
      });
      assertTakeHomeAccurate(cc, rows, taxData, scenario.filingStatus, scenario.golden);
    },
  );
});
