import { Show, createMemo, createSignal } from "solid-js";
import type { SankeyGraph } from "d3-sankey";
import type { ChartLink, ChartNode } from "~/components/tax/sankey/types/chartTypes";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/tax/sankey/layout/dimensions";
import { SankeyLinkPaths } from "~/components/tax/sankey/svg/SankeyLinkPaths";
import { SankeyNodeRects } from "~/components/tax/sankey/svg/SankeyNodeRects";
import { connectedNodeIds } from "~/components/tax/sankey/svg/sankeyHighlight";
import { money } from "~/lib/format/moneyFormat";

type Props = {
  graph: SankeyGraph<ChartNode, ChartLink>;
};

export function SankeyChartSvg(props: Props) {
  const [pinnedId, setPinnedId] = createSignal<string | null>(null);
  const [hoveredId, setHoveredId] = createSignal<string | null>(null);
  const activeNodeId = createMemo(() => hoveredId() ?? pinnedId());

  const highlightedNodes = createMemo(() => {
    const id = activeNodeId();
    if (!id) return null;
    return connectedNodeIds(props.graph, id);
  });

  const selectedNode = createMemo(() => {
    const id = activeNodeId();
    if (!id) return undefined;
    return props.graph.nodes.find((node) => node.id === id);
  });

  const selectNode = (nodeId: string) => {
    setPinnedId((current) => (current === nodeId ? null : nodeId));
    setHoveredId(nodeId);
  };

  return (
    <div>
      <div class="-mx-1 overflow-x-auto px-1 pb-1">
      <svg
        viewBox={`0 0 ${SANKEY_WIDTH} ${SANKEY_HEIGHT}`}
        class="w-full min-w-[640px] rounded-lg border border-border-subtle bg-surface-alt"
        overflow="visible"
        onMouseLeave={() => setHoveredId(null)}
      >
        <SankeyLinkPaths graph={props.graph} activeNodeId={activeNodeId} />
        <SankeyNodeRects
          graph={props.graph}
          activeNodeId={activeNodeId}
          highlightedNodes={highlightedNodes}
          onNodeHover={selectNode}
          onNodeLeave={() => setHoveredId(null)}
        />
      </svg>
      </div>
      <Show when={selectedNode()}>
        {(node) => (
          <p class="mt-3 rounded-lg border border-border bg-surface-alt px-3 py-2 text-xs leading-relaxed text-muted-foreground" role="status" aria-live="polite">
            <span class="font-medium text-foreground">{node().labels.default}</span>
            {" · "}
            {money.format(node().value ?? 0)}
            {node().description ? ` — ${node().description}` : ""}
          </p>
        )}
      </Show>
    </div>
  );
}
