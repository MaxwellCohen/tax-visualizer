import { Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { sankey } from "d3-sankey";
import type { SankeyGraph } from "d3-sankey";
import { SankeyChartSvg } from "~/components/taxSankey/SankeyChartSvg";
import type { ChartLink, ChartNode } from "~/components/taxSankey/chartTypes";
import { compareSankeyLinks } from "~/components/taxSankey/compareSankeyLinks";
import { compareSankeySiblings } from "~/components/taxSankey/compareSankeySiblings.logic";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/taxSankey/layout";
import { SankeyLink } from "~/lib/config/page/Page.config";
import type { CalculatedConfigItem } from "~/lib/taxCalc";

type TaxSankeyProps = {
  calculatedConfig: CalculatedConfigItem[] | null;
};

function makeSankeyData(cc: CalculatedConfigItem[] | null) {
  if (!cc?.length) {
    return undefined;
  }
  const clonedLinks = cc
    .filter(
      (item) =>
        item.computedValue > 0 && "link" in (item?.sankeySettings || {}),
    )
    .flatMap((item) => {
      return (
        (item.sankeySettings as { link?: SankeyLink[] })?.link?.map((link) => ({
          ...link,
          source: link.source,
          target: link.target,
          value: item.computedValue,
          fill: link.fill,
          stroke: link.stroke,
        })) || []
      );
    });

    const acc =  clonedLinks.reduce((acc, v) => {
      
      const [to, from] = acc[v.source] || [0, 0];
      
      acc[v.source] = [to, from + v.value];
      const [to2, from2] = acc[v.target] || [0, 0];
      acc[v.target] = [to2 + v.value, from2];
      return acc;
    }, {} as Record<string, [number, number]>)

  console.log("to", acc);

  if (!clonedLinks.length) {
    return undefined;
  }

  const nodeIdSet = new Set<string>();
  clonedLinks.forEach((link) => {
    nodeIdSet.add(link.source);
    nodeIdSet.add(link.target);
  });

  const clonedNodes = cc
    .filter((item) => nodeIdSet.has(item.id))
    .map((item) => ({
      id: item.id,
      label: item.label,
      ...(item.sankeySettings as { node?: any })?.node,
    }));

  if (!clonedNodes.length) {
    return undefined;
  }

  const sankeyGenerator = sankey<ChartNode, ChartLink>()
    .nodeId((node: ChartNode) => node.id)
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
}

export default function TaxSankey(props: TaxSankeyProps) {
  const sankeyData = createMemo(() => makeSankeyData(props.calculatedConfig));

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
        <p
          class="mb-4 max-w-3xl text-xs leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          How to read this: each income row on the left flows into ordinary or
          long-term taxable income (by source), then follow the flows into
          pre-tax payroll benefits, deductions, federal tax buckets, taxes,
          federal credits (when entered — drawn from the highest marginal-rate
          slice first), separate federal-tax and payroll-tax bars, and a single
          take-home bar. The &quot;shielded income&quot; path is a visual
          explanation of income removed by deductions and payroll pre-tax
          amounts, not a literal cash account. Payroll tax ribbons attach only
          to ordinary / LTCG ordinary bracket paths only (FICA does not apply to
          long-term gains, so LTCG bands have no payroll ribbons); payroll tax
          also appears as its own band beside ordinary brackets under ordinary
          taxable. Any remainder or from income rows as a fallback. Short-term
          capital gains still show as their own income stream on the left, but
          federal tax on them is not a separate band: the IRS taxes them as
          ordinary income, so that tax is included in the ordinary bracket
          slices (and any NIIT share in those slices&apos; totals).
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
          {(data) => <SankeyChartSvg graph={data.graph} />}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
