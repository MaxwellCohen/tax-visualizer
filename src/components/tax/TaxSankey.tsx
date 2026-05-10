import { Accessor, Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import { sankey } from "d3-sankey";
import type { SankeyGraph } from "d3-sankey";
import { SankeyChartSvg } from "~/components/tax/sankey/svg/SankeyChartSvg";
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

type TaxSankeyProps = {
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

function makeSankeyData(cc: CalculatedConfigItem[] | null) {
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

export default function TaxSankey(props: TaxSankeyProps) {
  const sankeyData = createMemo(() => makeSankeyData(props.calculatedConfig()));

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
          {(data) => <SankeyChartSvg graph={data} />}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
