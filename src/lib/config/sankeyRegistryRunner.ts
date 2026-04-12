import { CHART_REGISTRY } from "~/lib/config/chartMetricsRegistry";
import type { ChartRegistryEntry } from "~/lib/config/chartMetricsRegistry";
import type { SankeyMetricAppendContext } from "~/lib/config/sankeyMetricAppendContext";
import type { SankeyPhaseId } from "~/lib/config/sankeyPhaseId";

/**
 * Runs `sankey.append` for every registry row whose `sankey.phase` matches, in **registry array order**
 * (same order as pipeline / CHART_REGISTRY).
 */
export function runSankeyRegistryAppendersForPhase(
  phase: SankeyPhaseId,
  ctx: SankeyMetricAppendContext,
): void {
  for (const entry of CHART_REGISTRY) {
    const sankey = entry.sankey;
    if (!sankey?.phase || sankey.phase !== phase || !sankey.append) continue;
    sankey.append(ctx);
  }
}

/** Registry rows that participate in Sankey via `phase` + optional `append` (for tooling). */
export function chartMetricsRegistryEntriesWithSankeyAppend(): readonly ChartRegistryEntry[] {
  return CHART_REGISTRY.filter(
    (e): e is ChartRegistryEntry & { sankey: NonNullable<ChartRegistryEntry["sankey"]> } =>
      e.sankey != null && (e.sankey.phase != null || e.sankey.append != null),
  );
}
