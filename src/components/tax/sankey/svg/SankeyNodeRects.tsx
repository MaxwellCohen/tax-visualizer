import { For } from "solid-js";
import type { SankeyGraph } from "d3-sankey";
import type { ChartLink, ChartNode } from "~/components/tax/sankey/types/chartTypes";
import { LABEL_RIGHT_RESERVE, SANKEY_WIDTH } from "~/components/tax/sankey/layout/dimensions";
import { nodeFill } from "~/components/tax/sankey/style/sankeyColors";
import { money as sankeyMoney } from "~/lib/format/moneyFormat";

type Props = { graph: SankeyGraph<ChartNode, ChartLink> };

const COMPACT_BAND_HEIGHT = 28;

function sankeyLabelLines(node: ChartNode): {
  compact: boolean;
  title: string;
  line1: string;
  line2?: string;
} {
  const flow = node.value ?? 0;
  const fmt = sankeyMoney.format(flow);
  const h = Math.max(0, (node.y1 ?? 0) - (node.y0 ?? 0));
  const { labels, description } = node;
  const primary = labels.default;
  const shortLabel = labels.compact ?? labels.default;
  const title = description ?? labels.summary ?? `${primary}, ${fmt}`;

  if (h < COMPACT_BAND_HEIGHT) {
    return { compact: true, title, line1: `${shortLabel} · ${fmt}` };
  }
  return { compact: false, title, line1: primary, line2: fmt };
}

export function SankeyNodeRects(props: Props) {
  const width = SANKEY_WIDTH;
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
          <g data-node={node.id} data-row={node.row} data-col={node.col}>
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
                fill="var(--color-sankey-label)"
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
                fill="var(--color-sankey-label)"
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
                    fill="var(--color-muted-foreground)"
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
