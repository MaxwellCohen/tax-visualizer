import { newIncomeSource } from "~/lib/tax/calc/labeledAmountSource";
import { emptyAggregatedPretax, pretaxScalarsToMinimalSources } from "~/lib/tax/calc/pretaxBenefitSource";
import type { ScenarioPreset } from "~/lib/tax/scenario/types";
import {
  incomeSourcesToRows,
  pretaxSourcesToRows,
  taxFormDataFromParts,
} from "~/lib/tax/form/factories";

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "singleW2",
    label: "Single W-2",
    description: "Starter salary-only example with no pre-tax contributions.",
    buildInput: (taxYear) =>
      taxFormDataFromParts({
        taxYear,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 90_000, label: "Salary" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    id: "w2AndLtcg",
    label: "W-2 + LTCG",
    description: "Shows how ordinary income and long-term gains stack together.",
    buildInput: (taxYear) =>
      taxFormDataFromParts({
        taxYear,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 120_000, label: "Salary" }),
          newIncomeSource({ kind: "income-longTermCapGains-longTermCapGains-spouse1", amount: 25_000, label: "Brokerage sale" }),
        ]),
        pretaxRows: [{ id: "1", type: 'pretax', kind: "input-pretax-401K-preTax401kSpouse1", label: "401(k)", amount: 10000 }],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    id: "familyBenefits",
    label: "Family benefits",
    description: "Married-filing-jointly example with common payroll benefits.",
    buildInput: (taxYear) =>
      taxFormDataFromParts({
        taxYear,
        filingStatus: "marriedJoint",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages-spouse1", amount: 100_000, label: "Spouse 1 wages" }),
          newIncomeSource({ kind: "income-ordinary-wages-spouse2", amount: 80_000, label: "Spouse 2 wages" }),
        ]),
        pretaxRows: pretaxSourcesToRows(
          pretaxScalarsToMinimalSources({
            ...emptyAggregatedPretax(),
            preTax401kSpouse1: 11_000,
            preTax401kSpouse2: 11_000,
            preTaxHsaSpouse1: 3_000,
            preTaxHsaSpouse2: 3_000,
            preTaxOther: 3_000,
            traditionalIraSpouse1: 0,
            traditionalIraSpouse2: 0,
          }),
        ),
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
  {
    id: "highIncome",
    label: "High-income payroll",
    description: "Highlights Social Security wage-base behavior and Medicare surtax.",
    buildInput: (taxYear) =>
      taxFormDataFromParts({
        taxYear,
        filingStatus: "single",
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages", amount: 260_000, label: "Compensation" }),
          newIncomeSource({ kind: "income-ordinary-shortTermCapGains-shortTermCapGains-spouse1", amount: 15_000, label: "Short-term gains" }),
        ]),
        pretaxRows: pretaxSourcesToRows(
          pretaxScalarsToMinimalSources({
            ...emptyAggregatedPretax(),
            preTax401kSpouse1: 23_000,
            preTax401kSpouse2: 0,
            preTaxHsaSpouse1: 4_000,
            preTaxHsaSpouse2: 0,
            preTaxOther: 2_000,
            traditionalIraSpouse1: 0,
            traditionalIraSpouse2: 0,
          }),
        ),
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      }),
  },
];