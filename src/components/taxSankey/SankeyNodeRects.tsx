import { For } from "solid-js";
import type { SankeyGraph } from "d3-sankey";
import type { ChartLink, ChartNode } from "~/components/taxSankey/chartTypes";
import { LABEL_RIGHT_RESERVE, SANKEY_WIDTH } from "~/components/taxSankey/layout";
import { nodeFill } from "~/components/taxSankey/sankeyColors";
import { sankeyLabelLines } from "~/components/taxSankey/sankeyNodeLabels";
import { effect } from "solid-js/web";

type Props = { graph: SankeyGraph<ChartNode, ChartLink> };

export function SankeyNodeRects(props: Props) {
  const width = SANKEY_WIDTH;
  effect(() => {
    console.log("node", props.graph.nodes);
    });
  return (
    <For each={props.graph.nodes}>
      {node => {
        const x1 = node.x1 ?? 0;
        const labelInside = x1 > width - LABEL_RIGHT_RESERVE;
        const labelX = labelInside ? (node.x0 ?? 0) - 6 : x1 + 6;
        const y0 = node.y0 ?? 0;
        const y1 = node.y1 ?? y0;
        const midY = (y0 + y1) / 2;
        const anchor = labelInside ? "end" : "start";
        const lines = sankeyLabelLines(node);


        return (
          <g>
            <rect
              x={node.x0}
              y={node.y0}
              width={Math.max(1, (node.x1 ?? 0) - (node.x0 ?? 0))}
              height={Math.max(1, y1 - y0)}
              fill={nodeFill(node)}
              data-node={node.id}
              rx={3}
            />
            {lines.compact ? (
              <text
                x={labelX}
                y={midY}
                dominant-baseline="middle"
                text-anchor={anchor}
                font-size="9"
                font-family="var(--font-body)"
                fill="var(--sankey-label)"
              >
                <title>{lines.title}</title>
                {lines.line1}
              </text>
            ) : (
              <text
                x={labelX}
                y={midY}
                dominant-baseline="middle"
                text-anchor={anchor}
                font-size="10"
                font-family="var(--font-body)"
                fill="var(--sankey-label)"
              >
                <title>{lines.title}</title>
                <tspan x={labelX} dy="-0.55em">
                  {lines.line1}
                </tspan>
                {lines.line2 != null ? (
                  <tspan
                    x={labelX}
                    dy="1.15em"
                    font-size="9"
                    fill="var(--text-muted)"
                  >
                    {lines.line2}
                  </tspan>
                ) : null}
              </text>
            )}
          </g>
        );
      }}
    </For>
  );
}
