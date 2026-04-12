import type { FilingStatus } from "~/lib/taxData";
import type {
  FederalTaxCreditKind,
  IncomeKind,
  ItemizedDeductionKind,
  PretaxBenefitKind,
  TaxInput,
} from "~/lib/taxCalc.types";

type ScenarioPresetId = "singleW2" | "w2AndLtcg" | "familyBenefits" | "highIncome";

export type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  buildInput: (taxYear: number) => TaxInput;
};

export type SerializedItemizedDeductionRow = {
  id?: string;
  kind: ItemizedDeductionKind;
  label: string;
  amount: number;
};

export type SerializedFederalTaxCreditRow = {
  id?: string;
  kind: FederalTaxCreditKind;
  label: string;
  amount: number;
};

export type SerializedScenario = {
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
  itemizedDeductions?: SerializedItemizedDeductionRow[];
  federalTaxCredits?: SerializedFederalTaxCreditRow[];
};
