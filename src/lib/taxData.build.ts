import type { FederalTaxBracket, FilingStatusRecord } from "~/lib/taxData.types";

export function thresholdsToBrackets(thresholds: number[]): FederalTaxBracket[] {
  return [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37].map((rate, index) => ({
    rate,
    upTo: thresholds[index] ?? null,
  }));
}

export function buildFederalBrackets(
  single: number[],
  marriedJoint: number[],
  marriedSeparate: number[],
  headOfHousehold: number[],
): FilingStatusRecord<FederalTaxBracket[]> {
  return {
    single: thresholdsToBrackets(single),
    marriedJoint: thresholdsToBrackets(marriedJoint),
    marriedSeparate: thresholdsToBrackets(marriedSeparate),
    headOfHousehold: thresholdsToBrackets(headOfHousehold),
  };
}
