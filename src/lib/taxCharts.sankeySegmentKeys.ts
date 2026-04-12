import type { TaxSegment } from "~/lib/taxCalc.types";

/** Stable key for ordinary bracket segments — must match NIIT maps and federal credit allocation. */
export function ordinarySegmentKey(seg: Pick<TaxSegment, "id" | "rangeStart">): string {
  return seg.id ?? `ordinary-${seg.rangeStart}`;
}

/** Stable key for LTCG bracket segments — must match NIIT maps and federal credit allocation. */
export function ltcgSegmentKey(seg: Pick<TaxSegment, "id" | "rangeStart">): string {
  return seg.id ?? `ltcg-${seg.rangeStart}`;
}

export function ordinaryBracketNodeId(seg: Pick<TaxSegment, "id" | "rangeStart">): string {
  return `ordinary-bracket-${ordinarySegmentKey(seg)}`;
}

export function ltcgBracketNodeId(seg: Pick<TaxSegment, "id" | "rangeStart">): string {
  return `ltcg-bracket-${ltcgSegmentKey(seg)}`;
}
