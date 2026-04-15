import { For } from "solid-js";
import type { SankeyGraph } from "d3-sankey";
import { sankeyLinkPath, type ChartLink, type ChartNode } from "~/components/taxSankey/chartTypes";
import { linkStroke } from "~/components/taxSankey/sankeyColors";
import { sankeyMoney } from "~/components/taxSankey/sankeyFormat";

type Props = { graph: SankeyGraph<ChartNode, ChartLink> };

function linkLabelPosition(link: ChartLink) {
  const source = link.source as ChartNode;
  const target = link.target as ChartNode;
  const x0 = source.x1 ?? 0;
  const x1 = target.x0 ?? 0;
  const y0 = link.y0 ?? 0;
  const y1 = link.y1 ?? 0;
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
}

export function SankeyLinkPaths(props: Props) {
  return (
    <For each={props.graph.links}>
      {link => {
        const sourceNode = link.source as ChartNode;
        const targetNode = link.target as ChartNode;
        const { x, y } = linkLabelPosition(link);
        const amount = sankeyMoney.format(link.value ?? 0);
        return (
          <g data-link={`${sourceNode?.label} - ${targetNode?.label}`}>
            <title>{`${sourceNode.label} → ${targetNode.label}: ${amount}`}</title>
            <path
              d={sankeyLinkPath(link) ?? ""}
              fill="none"
              stroke={linkStroke(targetNode)}
              stroke-opacity="1"
              stroke-width={Math.max(1, link.width ?? 1)}
            />
            <text
              x={x}
              y={y}
              dominant-baseline="middle"
              text-anchor="middle"
              font-size="8"
              font-family="var(--font-body)"
              fill="var(--sankey-label)"
              pointer-events="none"
            >
             {`${sourceNode.id} → ${targetNode.id}`} 
            </text>
          </g>
        );
      }}
    </For>
  );
}
