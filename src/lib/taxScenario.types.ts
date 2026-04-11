import type { FilingStatus } from "~/lib/taxData";
import type { IncomeKind, TaxInput } from "~/lib/taxCalc.types";

export type ScenarioPresetId = "singleW2" | "w2AndLtcg" | "familyBenefits" | "highIncome";

export type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  buildInput: (taxYear: number) => TaxInput;
};

export type SerializedScenarioV1 = {
  version?: 1;
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: Array<{
    id?: string;
    kind: IncomeKind;
    label: string;
    amount: number;
  }>;
  preTax401k: number;
  preTaxHsa: number;
  preTaxOther: number;
  useItemizedDeductions: boolean;
  itemizedDeductions: number;
};

export type SerializedScenarioV2 = {
  version: 2;
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: Array<{
    id?: string;
    kind: IncomeKind;
    label: string;
    amount: number;
  }>;
  preTax401kSpouse1: number;
  preTax401kSpouse2: number;
  preTaxHsaSpouse1: number;
  preTaxHsaSpouse2: number;
  preTaxOther: number;
  traditionalIraSpouse1?: number;
  traditionalIraSpouse2?: number;
  useItemizedDeductions: boolean;
  itemizedDeductions: number;
};

export type SerializedScenario = SerializedScenarioV1 | SerializedScenarioV2;
