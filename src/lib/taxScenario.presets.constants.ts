import { newFederalTaxCreditSource } from "~/lib/taxCalc.federalTaxCreditSource";
import { newItemizedDeductionSource } from "~/lib/taxCalc.itemizedDeductionSource";
import { newIncomeSource } from "~/lib/taxCalc.labeledAmountSource";
import { emptyAggregatedPretax, pretaxScalarsToMinimalSources } from "~/lib/taxCalc.pretaxBenefitSource";
import type { ScenarioPreset } from "~/lib/taxScenario.types";
import {
  federalCreditsToRows,
  incomeSourcesToRows,
  itemizedSourcesToRows,
  pretaxSourcesToRows,
  taxFormDataFromParts,
} from "~/lib/taxForm.factories";

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
          newIncomeSource({ kind: "input-wages-wages", amount: 90_000, label: "Salary" }),
        ]),
        pretaxRows: pretaxSourcesToRows(
          pretaxScalarsToMinimalSources({
            ...emptyAggregatedPretax(),
            preTax401kSpouse1: 0,
            preTax401kSpouse2: 0,
            preTaxHsaSpouse1: 0,
            preTaxHsaSpouse2: 0,
            preTaxOther: 0,
            traditionalIraSpouse1: 0,
            traditionalIraSpouse2: 0,
          }),
        ),
        useItemizedDeductions: false,
        deductionRows: itemizedSourcesToRows([newItemizedDeductionSource()]),
        creditRows: federalCreditsToRows([newFederalTaxCreditSource()]),
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
          newIncomeSource({ kind: "input-wages-wages", amount: 120_000, label: "Salary" }),
          newIncomeSource({ kind: "input-longTermCapGains-longTermCapGains", amount: 25_000, label: "Brokerage sale" }),
        ]),
        pretaxRows: pretaxSourcesToRows(
          pretaxScalarsToMinimalSources({
            ...emptyAggregatedPretax(),
            preTax401kSpouse1: 10_000,
            preTax401kSpouse2: 0,
            preTaxHsaSpouse1: 0,
            preTaxHsaSpouse2: 0,
            preTaxOther: 0,
            traditionalIraSpouse1: 0,
            traditionalIraSpouse2: 0,
          }),
        ),
        useItemizedDeductions: false,
        deductionRows: itemizedSourcesToRows([newItemizedDeductionSource()]),
        creditRows: federalCreditsToRows([newFederalTaxCreditSource()]),
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
          newIncomeSource({ kind: "input-wages-wages", amount: 180_000, label: "Household wages" }),
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
        deductionRows: itemizedSourcesToRows([newItemizedDeductionSource()]),
        creditRows: federalCreditsToRows([newFederalTaxCreditSource()]),
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
          newIncomeSource({ kind: "input-wages-wages", amount: 260_000, label: "Compensation" }),
          newIncomeSource({ kind: "input-shortTermCapGains-shortTermCapGains", amount: 15_000, label: "Short-term gains" }),
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
        deductionRows: itemizedSourcesToRows([newItemizedDeductionSource()]),
        creditRows: federalCreditsToRows([newFederalTaxCreditSource()]),
      }),
  },
];
