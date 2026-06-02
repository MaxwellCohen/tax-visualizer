import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";

/** Net federal income tax after credits, from the tax-page registry (`federalIncomeTax`). */
export function getFederalIncomeTaxLiability(
  calculatedConfig: CalculatedConfigItem[] | null | undefined,
): number | null {
  if (!calculatedConfig) return null;
  const item = calculatedConfig.find((i) => i.id === "federalIncomeTax");
  if (!item) return null;
  return item.computedValue;
}
