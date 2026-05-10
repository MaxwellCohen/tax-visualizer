import type { FilingStatus } from "~/lib/tax/data/types";

const ORDINARY_RATES = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];

export const THRESHOLDS_200K_250K_125K_200K: Record<FilingStatus, number> = {
  single: 200000,
  marriedJoint: 250000,
  marriedSeparate: 125000,
  headOfHousehold: 200000,
};

export function buildBrackets(
  single: number[],
  marriedJoint: number[],
  marriedSeparate: number[],
  headOfHousehold: number[],
): Record<FilingStatus, { upTo: number | null; rate: number }[]> {
  return {
    single: ordinaryBrackets(single),
    marriedJoint: ordinaryBrackets(marriedJoint),
    marriedSeparate: ordinaryBrackets(marriedSeparate),
    headOfHousehold: ordinaryBrackets(headOfHousehold),
  };
}

export function buildLtcgBrackets(
  single: [number, number],
  marriedJoint: [number, number],
  marriedSeparate: [number, number],
  headOfHousehold: [number, number],
) {
  return [
    { filingStatus: "single" as const, brackets: ltcgBrackets(single) },
    { filingStatus: "marriedJoint" as const, brackets: ltcgBrackets(marriedJoint) },
    { filingStatus: "marriedSeparate" as const, brackets: ltcgBrackets(marriedSeparate) },
    { filingStatus: "headOfHousehold" as const, brackets: ltcgBrackets(headOfHousehold) },
  ];
}

function ordinaryBrackets(upTos: number[]): { upTo: number | null; rate: number }[] {
  const brackets: { upTo: number | null; rate: number }[] = upTos.map((upTo, i) => ({
    upTo,
    rate: ORDINARY_RATES[i],
  }));
  return brackets.concat([{ upTo: null, rate: 0.37 }]);
}

function ltcgBrackets(thresholds: [number, number]) {
  return [
    { upTo: thresholds[0], rate: 0 },
    { upTo: thresholds[1], rate: 0.15 },
    { upTo: null, rate: 0.20 },
  ];
}
