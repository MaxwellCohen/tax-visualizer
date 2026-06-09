import { describe, expect, it } from "vitest";
import { calculateAllConfigValues } from "~/lib/tax/calc/calculateTaxes";
import { evaluateTaxScenario } from "~/lib/tax/calc/taxEvaluation";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import { fallbackScenario } from "~/lib/tax/scenario/sanitizeHelpers";

function configValue(cc: ReturnType<typeof calculateAllConfigValues>, id: string): number {
  return cc.find((item) => item.id === id)?.computedValue ?? 0;
}

describe("evaluateTaxScenario", () => {
  it("is the shared source for calculated-config federal tax and take-home values", () => {
    const taxData = getTaxYearConfig(2026);
    expect(taxData).not.toBeNull();
    const form = fallbackScenario(2026);
    const context = evaluateTaxScenario(form.rows, taxData!, "single");
    const calculatedConfig = calculateAllConfigValues(form, taxData!, "single");

    expect(configValue(calculatedConfig, "federalIncomeTax")).toBe(context.federalIncomeTax);
    expect(configValue(calculatedConfig, "takeHomePay")).toBe(context.takeHomePay);
    expect(configValue(calculatedConfig, "federalTaxCreditsApplied")).toBe(context.federalTaxCreditsApplied);
    expect(context.federalTaxCreditsApplied).toBeLessThanOrEqual(context.totalCredits);
    expect(context.taxBuckets.reduce((sum, bucket) => sum + bucket.tax, 0)).toBe(context.federalIncomeTax);
  });
});
