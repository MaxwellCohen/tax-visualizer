import type { TaxInput } from "~/lib/taxCalc.types";
import { SCENARIO_PRESETS } from "~/lib/taxScenario.presets.constants";
import { sanitizeScenarioInput } from "~/lib/taxScenario.sanitizeScenarioInput";
import type { ScenarioPreset, SerializedScenario } from "~/lib/taxScenario.types";

export function serializeScenarioInput(input: TaxInput): string {
  const hasNonEmptyItemized = input.itemizedDeductions.some(d => d.amount > 0);
  const hasNonEmptyCredits = input.federalTaxCredits.some(c => c.amount > 0);

  const payload: SerializedScenario = {
    version: 4,
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: input.incomeSources.map(source => ({
      id: source.id,
      kind: source.kind,
      label: source.label,
      amount: source.amount,
    })),
    pretaxBenefitSources: input.pretaxBenefitSources.map(row => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      amount: row.amount,
    })),
    useItemizedDeductions: input.useItemizedDeductions,
    ...(hasNonEmptyItemized && {
      itemizedDeductions: input.itemizedDeductions.map(row => ({
        id: row.id,
        kind: row.kind,
        label: row.label,
        amount: row.amount,
      })),
    }),
    ...(hasNonEmptyCredits && {
      federalTaxCredits: input.federalTaxCredits.map(row => ({
        id: row.id,
        kind: row.kind,
        label: row.label,
        amount: row.amount,
      })),
    }),
  };
  return JSON.stringify(payload);
}

export function deserializeScenarioInput(
  value: string,
  availableYears: number[],
  fallbackYear: number,
): TaxInput | null {
  try {
    return sanitizeScenarioInput(JSON.parse(value), availableYears, fallbackYear);
  } catch {
    try {
      return sanitizeScenarioInput(
        JSON.parse(decodeURIComponent(value)),
        availableYears,
        fallbackYear,
      );
    } catch {
      return null;
    }
  }
}

export function getScenarioPresets(): ScenarioPreset[] {
  return SCENARIO_PRESETS;
}
