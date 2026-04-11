import { For } from "solid-js";
import type { SankeyGraph } from "d3-sankey";
import { sankeyLinkPath, type ChartLink, type ChartNode } from "~/components/taxSankey/chartTypes";
import { linkStroke } from "~/components/taxSankey/sankeyColors";
import { sankeyMoney } from "~/components/taxSankey/sankeyFormat";

type Props = { graph: SankeyGraph<ChartNode, ChartLink> };

export function SankeyLinkPaths(props: Props) {
  return (
    <For each={props.graph.links}>
      {link => {
        const targetNode = link.target as ChartNode;
        return (
          <path
            d={sankeyLinkPath(link) ?? ""}
            fill="none"
            stroke={linkStroke(targetNode)}
            stroke-opacity="1"
            stroke-width={Math.max(1, link.width ?? 1)}
          >
            <title>{`${(link.source as ChartNode).label} → ${targetNode.label}: ${sankeyMoney.format(link.value ?? 0)}`}</title>
          </path>
        );
      }}
    </For>
  );
}
