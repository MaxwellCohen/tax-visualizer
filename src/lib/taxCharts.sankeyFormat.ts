import type { TaxSegment } from "~/lib/taxCalc.types";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatOrdinaryBracketLabel(segment: TaxSegment): string {
  const rateLabel = `${Math.round(segment.marginalRate * 100)}%`;
  const rangeLabel =
    segment.rangeEnd == null
      ? `${money.format(segment.rangeStart)}+`
      : `${money.format(segment.rangeStart)}-${money.format(segment.rangeEnd)}`;
  return `${rateLabel} (${rangeLabel})`;
}

export function formatLtcgBracketLabel(segment: TaxSegment): string {
  return `LTCG ${Math.round(segment.marginalRate * 100)}%`;
}
