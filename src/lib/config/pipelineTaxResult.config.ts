import type { TaxYearConfig } from "~/lib/taxData.types";
import { getConfigItems } from"./page/Page.config";

/** Canonical chart-metric key order - now derived from getConfigItems */
export function getPipelineComputedRowOrder(taxData: TaxYearConfig, filingStatus: string): string[] {
  const items = getConfigItems(taxData, filingStatus as any);
  return items.map((i: any) => i.id);
}


/** All registry metric keys for resolve / exhaustiveness checks. */
export function getTaxChartMetricsKeys(taxData: TaxYearConfig, filingStatus: string): string[] {
  return getPipelineComputedRowOrder(taxData, filingStatus);
}
