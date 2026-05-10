import type { SankeyGraph } from "d3-sankey";
import type { ChartLink, ChartNode } from "~/components/tax/sankey/types/chartTypes";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/tax/sankey/layout/dimensions";
import { SankeyLinkPaths } from "~/components/tax/sankey/svg/SankeyLinkPaths";
import { SankeyNodeRects } from "~/components/tax/sankey/svg/SankeyNodeRects";

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
        background: "var(--color-surface-alt)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <SankeyLinkPaths graph={props.graph} />
      <SankeyNodeRects graph={props.graph} />
    </svg>
  );
}
