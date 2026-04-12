import { CHART_METRICS_REGISTRY } from "~/lib/config/chartMetricsRegistry";
import type { ChartMetricRegistryEntry } from "~/lib/config/chartMetricsRegistry";
import type { SankeyMetricAppendContext } from "~/lib/config/sankeyMetricAppendContext";
import type { SankeyPhaseId } from "~/lib/config/sankeyPhaseId";

/**
 * Runs `sankey.append` for every registry row whose `sankey.phase` matches, in **registry array order**
 * (same order as pipeline / CHART_METRICS_REGISTRY).
 */
export function runSankeyRegistryAppendersForPhase(
  phase: SankeyPhaseId,
  ctx: SankeyMetricAppendContext,
): void {
  for (const entry of CHART_METRICS_REGISTRY) {
    const sankey = entry.sankey;
    if (!sankey?.phase || sankey.phase !== phase || !sankey.append) continue;
    sankey.append(ctx);
  }
}

/** Registry rows that participate in Sankey via `phase` + optional `append` (for tooling). */
export function chartMetricsRegistryEntriesWithSankeyAppend(): readonly ChartMetricRegistryEntry[] {
  return CHART_METRICS_REGISTRY.filter(
    (e): e is ChartMetricRegistryEntry & { sankey: NonNullable<ChartMetricRegistryEntry["sankey"]> } =>
      e.sankey != null && (e.sankey.phase != null || e.sankey.append != null),
  );
}
