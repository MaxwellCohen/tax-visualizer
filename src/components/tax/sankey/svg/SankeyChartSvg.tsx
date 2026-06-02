import { createMemo, createSignal } from "solid-js";
import type { SankeyGraph } from "d3-sankey";
import type { ChartLink, ChartNode } from "~/components/tax/sankey/types/chartTypes";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/tax/sankey/layout/dimensions";
import { SankeyLinkPaths } from "~/components/tax/sankey/svg/SankeyLinkPaths";
import { SankeyNodeRects } from "~/components/tax/sankey/svg/SankeyNodeRects";
import { connectedNodeIds } from "~/components/tax/sankey/svg/sankeyHighlight";

type Props = {
  graph: SankeyGraph<ChartNode, ChartLink>;
};

export function SankeyChartSvg(props: Props) {
  const [activeNodeId, setActiveNodeId] = createSignal<string | null>(null);

  const highlightedNodes = createMemo(() => {
    const id = activeNodeId();
    if (!id) return null;
    return connectedNodeIds(props.graph, id);
  });

  const clearHighlight = () => setActiveNodeId(null);

  return (
    <svg
      viewBox={`0 0 ${SANKEY_WIDTH} ${SANKEY_HEIGHT}`}
      class="w-full rounded-lg border border-border-subtle bg-surface-alt"
      overflow="visible"
      onMouseLeave={clearHighlight}
    >
      <SankeyLinkPaths graph={props.graph} activeNodeId={activeNodeId} />
      <SankeyNodeRects
        graph={props.graph}
        activeNodeId={activeNodeId}
        highlightedNodes={highlightedNodes}
        onNodeHover={setActiveNodeId}
        onNodeLeave={clearHighlight}
      />
    </svg>
  );
}
