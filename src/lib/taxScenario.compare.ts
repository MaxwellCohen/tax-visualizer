import type { TaxInput } from "~/lib/taxCalc.types";
import type { ScenarioPreset } from "~/lib/taxScenario.types";

function taxInputSignature(input: TaxInput): string {
  return JSON.stringify({
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: input.incomeSources.map(s => [s.kind, s.label, s.amount]),
    pretaxBenefitSources: input.pretaxBenefitSources.map(s => [s.kind, s.label, s.amount]),
    useItemizedDeductions: input.useItemizedDeductions,
    itemizedDeductions: input.itemizedDeductions,
  });
}

export function taxInputMatchesPreset(current: TaxInput, preset: ScenarioPreset): boolean {
  return taxInputSignature(current) === taxInputSignature(preset.buildInput(current.taxYear));
}
