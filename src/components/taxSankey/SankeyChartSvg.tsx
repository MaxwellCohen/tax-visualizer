import type { SankeyGraph } from "d3-sankey";
import type { ChartLink, ChartNode } from "~/components/taxSankey/chartTypes";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/taxSankey/layout";
import { SankeyLinkPaths } from "~/components/taxSankey/SankeyLinkPaths";
import { SankeyNodeRects } from "~/components/taxSankey/SankeyNodeRects";

type Props = {
  graph: SankeyGraph<ChartNode, ChartLink>;
};

export function SankeyChartSvg(props: Props) {
  return (
    <svg
      viewBox={`0 0 ${SANKEY_WIDTH} ${SANKEY_HEIGHT}`}
      class="w-full rounded-lg"
      overflow="visible"
      style={{
        background: "var(--surface-alt)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <SankeyLinkPaths graph={props.graph} />
      <SankeyNodeRects graph={props.graph} />
    </svg>
  );
}
