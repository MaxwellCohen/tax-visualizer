import { newFederalTaxCreditSource } from "~/lib/taxCalc.federalTaxCreditSource";
import { newItemizedDeductionSource } from "~/lib/taxCalc.itemizedDeductionSource";
import { newIncomeSource } from "~/lib/taxCalc.incomeSource";
import { pretaxScalarsToMinimalSources } from "~/lib/taxCalc.pretaxBenefitSource";
import type { ScenarioPreset } from "~/lib/taxScenario.types";

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "singleW2",
    label: "Single W-2",
    description: "Starter salary-only example with no pre-tax contributions.",
    buildInput: taxYear => ({
      taxYear,
      filingStatus: "single",
      incomeSources: [newIncomeSource({ kind: "wages", amount: 90_000, label: "Salary" })],
      pretaxBenefitSources: pretaxScalarsToMinimalSources({
        preTax401kSpouse1: 0,
        preTax401kSpouse2: 0,
        preTaxHsaSpouse1: 0,
        preTaxHsaSpouse2: 0,
        preTaxOther: 0,
        traditionalIraSpouse1: 0,
        traditionalIraSpouse2: 0,
      }),
      useItemizedDeductions: false,
      itemizedDeductions: [newItemizedDeductionSource()],
      federalTaxCredits: [newFederalTaxCreditSource()],
    }),
  },
  {
    id: "w2AndLtcg",
    label: "W-2 + LTCG",
    description: "Shows how ordinary income and long-term gains stack together.",
    buildInput: taxYear => ({
      taxYear,
      filingStatus: "single",
      incomeSources: [
        newIncomeSource({ kind: "wages", amount: 120_000, label: "Salary" }),
        newIncomeSource({ kind: "longTermCapGains", amount: 25_000, label: "Brokerage sale" }),
      ],
      pretaxBenefitSources: pretaxScalarsToMinimalSources({
        preTax401kSpouse1: 10_000,
        preTax401kSpouse2: 0,
        preTaxHsaSpouse1: 0,
        preTaxHsaSpouse2: 0,
        preTaxOther: 0,
        traditionalIraSpouse1: 0,
        traditionalIraSpouse2: 0,
      }),
      useItemizedDeductions: false,
      itemizedDeductions: [newItemizedDeductionSource()],
      federalTaxCredits: [newFederalTaxCreditSource()],
    }),
  },
  {
    id: "familyBenefits",
    label: "Family benefits",
    description: "Married-filing-jointly example with common payroll benefits.",
    buildInput: taxYear => ({
      taxYear,
      filingStatus: "marriedJoint",
      incomeSources: [newIncomeSource({ kind: "wages", amount: 180_000, label: "Household wages" })],
      pretaxBenefitSources: pretaxScalarsToMinimalSources({
        preTax401kSpouse1: 11_000,
        preTax401kSpouse2: 11_000,
        preTaxHsaSpouse1: 3_000,
        preTaxHsaSpouse2: 3_000,
        preTaxOther: 3_000,
        traditionalIraSpouse1: 0,
        traditionalIraSpouse2: 0,
      }),
      useItemizedDeductions: false,
      itemizedDeductions: [newItemizedDeductionSource()],
      federalTaxCredits: [newFederalTaxCreditSource()],
    }),
  },
  {
    id: "highIncome",
    label: "High-income payroll",
    description: "Highlights Social Security wage-base behavior and Medicare surtax.",
    buildInput: taxYear => ({
      taxYear,
      filingStatus: "single",
      incomeSources: [
        newIncomeSource({ kind: "wages", amount: 260_000, label: "Compensation" }),
        newIncomeSource({ kind: "shortTermCapGains", amount: 15_000, label: "Short-term gains" }),
      ],
      pretaxBenefitSources: pretaxScalarsToMinimalSources({
        preTax401kSpouse1: 23_000,
        preTax401kSpouse2: 0,
        preTaxHsaSpouse1: 4_000,
        preTaxHsaSpouse2: 0,
        preTaxOther: 2_000,
        traditionalIraSpouse1: 0,
        traditionalIraSpouse2: 0,
      }),
      useItemizedDeductions: false,
      itemizedDeductions: [newItemizedDeductionSource()],
      federalTaxCredits: [newFederalTaxCreditSource()],
    }),
  },
];
