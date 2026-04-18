import type { TaxResult, TaxResultDisplay } from "~/lib/taxForm.types";

/**
 * Builds display bundle. Mekko rows now built from CalculatedConfigItem[].
 */
export function buildTaxResultDisplayBundle(_result: TaxResult): TaxResultDisplay {
  return {
    mekko: { rows: [] },
  };
}
