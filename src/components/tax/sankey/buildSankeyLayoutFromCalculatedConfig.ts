import { sankey } from "d3-sankey";
import type { SankeyGraph } from "d3-sankey";
import type { ChartLink, ChartNode } from "~/components/tax/sankey/types/chartTypes";
import { compareSankeyItemsByRowAndCol } from "~/components/tax/sankey/compare/compareSankeyLinks";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/tax/sankey/layout/dimensions";
import { resolveChartStyle } from "~/lib/config/taxPage/chart/chartStyle";
import type { SankeyLink, SankeyNode } from "~/lib/config/taxPage/types";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";

type ClonedSankeyLink = SankeyLink & {
    value: number;
    fill: string;
    stroke: string;
};

type ClonedSankeyNode = Partial<SankeyNode> & {
    id: string;
    labels: CalculatedConfigItem["labels"];
    description?: string;
    fill: string;
    stroke: string;
};

/**
 * Pure Sankey layout from calculated config — testable without Solid.
 * UI adapter: {@link TaxSankey} renders the returned graph with {@link SankeyChartSvg}.
 */
export function buildSankeyLayoutFromCalculatedConfig(
    cc: CalculatedConfigItem[] | null | undefined,
): SankeyGraph<ChartNode, ChartLink> | undefined {
    if (!cc?.length) {
        return undefined;
    }
    const nodeIdSet = new Set<string>();
    const clonedLinks = cc.reduce<ClonedSankeyLink[]>((acc, item) => {
        if (item.computedValue <= 0 || !item.sankey?.links?.length) {
            return acc;
        }
        const chartStyle = resolveChartStyle(item);
        for (const link of item.sankey.links) {
            nodeIdSet.add(link.source);
            nodeIdSet.add(link.target);
            acc.push({
                ...link,
                ...chartStyle,
                value: item.computedValue,
            });
        }
        return acc;
    }, []);

    if (!clonedLinks.length) {
        return undefined;
    }

    const clonedNodes = cc.reduce<ClonedSankeyNode[]>((acc, item) => {
        if (!nodeIdSet.has(item.id)) {
            return acc;
        }
        acc.push({
            id: item.id,
            labels: item.labels,
            description: item.description,
            ...resolveChartStyle(item),
            ...item.sankey?.node,
        });
        return acc;
    }, []);

    if (!clonedNodes.length) {
        return undefined;
    }

    const sankeyGenerator = sankey<ChartNode, ChartLink>()
        .nodeId((node: ChartNode) => node.id)
        .nodeWidth(18)
        .nodePadding(14)
        .nodeSort(compareSankeyItemsByRowAndCol)
        .linkSort(compareSankeyItemsByRowAndCol)
        .iterations(32)
        .extent([
            [8, 8],
            [SANKEY_WIDTH - 8, SANKEY_HEIGHT - 8],
        ]);

    return sankeyGenerator({
        nodes: clonedNodes,
        links: clonedLinks,
    } as SankeyGraph<ChartNode, ChartLink>);
}
