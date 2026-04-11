import { Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { sankey } from "d3-sankey";
import type { SankeyGraph } from "d3-sankey";
import { SankeyChartSvg } from "~/components/taxSankey/SankeyChartSvg";
import type { ChartLink, ChartNode } from "~/components/taxSankey/chartTypes";
import { compareSankeyLinks } from "~/components/taxSankey/compareSankeyLinks";
import { compareSankeySiblings } from "~/components/taxSankey/compareSankeySiblings";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/taxSankey/layout";
import { buildSankeyChartData } from "~/lib/taxCharts";
import type { TaxResult } from "~/lib/taxCalc";

type TaxSankeyProps = {
  result: TaxResult;
};

export default function TaxSankey(props: TaxSankeyProps) {
  const sankeyData = createMemo(() => {
    const chart = buildSankeyChartData(props.result);
    const clonedNodes: ChartNode[] = chart.nodes.map(node => ({ ...node }));
    const clonedLinks: ChartLink[] = chart.links
      .filter(link => link.value > 0)
      .map(link => ({ source: link.sourceId, target: link.targetId, value: link.value }));

    if (clonedLinks.length === 0) {
      return undefined;
    }

    const sankeyGenerator = sankey<ChartNode, ChartLink>()
      .nodeId(node => node.id)
      .nodeWidth(18)
      .nodePadding(14)
      .nodeSort(compareSankeySiblings)
      .linkSort(compareSankeyLinks)
      .iterations(32)
      .extent([
        [8, 8],
        [SANKEY_WIDTH - 8, SANKEY_HEIGHT - 8],
      ]);

    const graph = sankeyGenerator({
      nodes: clonedNodes,
      links: clonedLinks,
    } as SankeyGraph<ChartNode, ChartLink>);

    return { graph };
  });

  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <CollapsibleBlock title="Tax Flow" bodyClass="mt-4">
        <p class="mb-4 max-w-3xl text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          How to read this: start at gross income, then follow the flows into pre-tax payroll
          benefits, deductions, federal tax buckets, taxes, and modeled take-home pay. The
          &quot;shielded income&quot; path is a visual explanation of income removed by deductions, not
          a literal cash account. Short-term capital gains still show as their own income stream on
          the left, but federal tax on them is not a separate band: the IRS taxes them as ordinary
          income, so that tax is included in the ordinary bracket slices (and any NIIT share in those
          slices&apos; totals).
        </p>
        <Show
          keyed
          when={sankeyData()}
          fallback={
            <p class="text-sm" style={{ color: "var(--text-faint)" }}>
              Enter income to see the flow.
            </p>
          }
        >
          {data => <SankeyChartSvg graph={data.graph} />}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
