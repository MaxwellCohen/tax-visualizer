import type { TaxFormData } from "~/lib/tax/form/types";

type ScenarioPresetId = "singleW2" | "w2AndLtcg" | "familyBenefits" | "highIncome";

export type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  buildInput: (taxYear: number) => TaxFormData;
};


