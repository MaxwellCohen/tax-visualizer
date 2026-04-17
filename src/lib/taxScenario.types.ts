import type { TaxFormRow } from "~/lib/taxForm.types";
import type { TaxFormData } from "~/lib/taxForm.types";

type ScenarioPresetId = "singleW2" | "w2AndLtcg" | "familyBenefits" | "highIncome";

export type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  buildInput: (taxYear: number) => TaxFormData;
};

export type SerializedScenarioV5 =TaxFormRow[];

export type SerializedScenario = SerializedScenarioV5;
