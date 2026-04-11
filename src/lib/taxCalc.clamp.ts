import { getTaxYearConfig } from "~/lib/taxData";
import type { TaxInput } from "~/lib/taxCalc.types";
import {
  aggregatePretaxFromSources,
  clampAggregatedPretaxToLimits,
  distributeAggregatedPretaxToSources,
  filterPretaxSourcesForFiling,
} from "~/lib/taxCalc.pretaxBenefitSource";

/** Clamps 401(k), HSA, and traditional IRA rows to year limits in `TAX_DATA_BY_YEAR` (shared URLs, imports). */
export function clampTaxInputPretaxToLimits(input: TaxInput): TaxInput {
  const config = getTaxYearConfig(input.taxYear);
  if (!config) return input;

  const joint = input.filingStatus === "marriedJoint";
  const filtered = filterPretaxSourcesForFiling(input.pretaxBenefitSources, joint);
  const agg = aggregatePretaxFromSources(filtered, joint);
  const clamped = clampAggregatedPretaxToLimits(agg, config.pretaxLimits, joint);
  const nextSources = distributeAggregatedPretaxToSources(filtered, clamped);

  return {
    ...input,
    pretaxBenefitSources: nextSources,
  };
}
