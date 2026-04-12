import type { FilingStatus } from "~/lib/taxData";
import type {
  FederalTaxCreditKind,
  IncomeKind,
  ItemizedDeductionKind,
  PretaxBenefitKind,
} from "~/lib/taxCalc.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { TaxFormData } from "~/lib/taxForm.types";

type ScenarioPresetId = "singleW2" | "w2AndLtcg" | "familyBenefits" | "highIncome";

export type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  buildInput: (taxYear: number) => TaxFormData;
};

export type SerializedScenarioV5 = {
  version: 5;
  rows: TaxFormRow[];
};

/** @deprecated Legacy type kept for documentation; only v5 is accepted */
export type SerializedScenarioV4 = {
  version: 4;
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: Array<{
    id?: string;
    kind: IncomeKind;
    label: string;
    amount: number;
  }>;
  pretaxBenefitSources: Array<{
    id?: string;
    kind: PretaxBenefitKind;
    label: string;
    amount: number;
  }>;
  useItemizedDeductions: boolean;
  itemizedDeductions?: Array<{
    id?: string;
    kind: ItemizedDeductionKind;
    label: string;
    amount: number;
  }>;
  federalTaxCredits?: Array<{
    id?: string;
    kind: FederalTaxCreditKind;
    label: string;
    amount: number;
  }>;
};

export type SerializedScenario = SerializedScenarioV5;
