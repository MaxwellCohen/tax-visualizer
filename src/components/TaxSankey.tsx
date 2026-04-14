import { Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { sankey } from "d3-sankey";
import type { SankeyGraph } from "d3-sankey";
import { SankeyChartSvg } from "~/components/taxSankey/SankeyChartSvg";
import { taxSankeyNodeAlign } from "~/components/taxSankey/taxSankeyNodeAlign";
import type { ChartLink, ChartNode } from "~/components/taxSankey/chartTypes";
import { compareSankeyLinks } from "~/components/taxSankey/compareSankeyLinks";
import { compareSankeySiblings } from "~/components/taxSankey/compareSankeySiblings";
import { SANKEY_HEIGHT, SANKEY_WIDTH } from "~/components/taxSankey/layout";
import { computeSankeyFromConfig, computeSankeyFromConfigWithValues, getConfigItems } from "~/lib/config/page/Page.config";
import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { getTaxYearConfig } from "~/lib/taxData";
import type { TaxResult, TaxFormRow, CalculatedConfigItem } from "~/lib/taxCalc";
import { isFormRow } from "~/lib/taxForm.types";

type TaxSankeyProps = {
  result: TaxResult;
  calculatedConfig: CalculatedConfigItem[] | null;
};

export default function TaxSankey(props: TaxSankeyProps) {
  const sankeyData = createMemo(() => {
    const formRows = props.result.rows.filter(isFormRow);
    const filingStatus = getFilingStatusFromRows(formRows);
    const taxYear = getTaxYearFromRows(formRows);
    const taxData = getTaxYearConfig(taxYear);
    if (!taxData) return undefined;
    
    const config = props.calculatedConfig;
    if (config) {
      const computedValues = new Map<string, number>();
      for (const item of config) {
        computedValues.set(item.id, item.computedValue);
      }
      const items = getConfigItems(taxData, filingStatus);
      const chart = computeSankeyFromConfigWithValues(items, computedValues);
      
      const clonedNodes: ChartNode[] = chart.nodes.map((node) => ({ 
        id: node.id,
        label: node.label,
        kind: node.kind as any,
        amount: node.amount,
        fill: node.fill,
        stroke: node.stroke,
      }));
      const clonedLinks: ChartLink[] = chart.links
        .filter((link) => link.value > 0)
        .map((link) => ({ source: link.sourceId, target: link.targetId, value: link.value }));
        
      if (clonedLinks.length === 0) {
        return undefined;
      }

      const sankeyGenerator = sankey<ChartNode, ChartLink>()
        .nodeId((node: ChartNode) => node.id)
        .nodeWidth(18)
        .nodePadding(14)
        .nodeAlign(taxSankeyNodeAlign)
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
    
    const items = getConfigItems(taxData, filingStatus);
    const chart = computeSankeyFromConfig(items, formRows as any, taxData, filingStatus);
    
    const clonedNodes: ChartNode[] = chart.nodes.map((node) => ({ 
      id: node.id,
      label: node.label,
      kind: node.kind as any,
      amount: node.amount,
      fill: node.fill,
      stroke: node.stroke,
    }));
    const clonedLinks: ChartLink[] = chart.links
      .filter((link) => link.value > 0)
      .map((link) => ({ source: link.sourceId, target: link.targetId, value: link.value }));
      
    if (clonedLinks.length === 0) {
      return undefined;
    }

    const sankeyGenerator = sankey<ChartNode, ChartLink>()
      .nodeId((node: ChartNode) => node.id)
      .nodeWidth(18)
      .nodePadding(14)
      .nodeAlign(taxSankeyNodeAlign)
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
          How to read this: each income row on the left flows into ordinary or long-term taxable
          income (by source), then follow the flows into pre-tax payroll
          benefits, deductions, federal tax buckets, taxes, federal credits (when entered — drawn from the highest
          marginal-rate slice first), separate federal-tax and payroll-tax bars, and a single take-home bar. The
          &quot;shielded income&quot; path is a visual explanation of income removed by deductions and payroll
          pre-tax amounts, not a literal cash account. Payroll tax ribbons attach only to ordinary / LTCG
          ordinary bracket paths only (FICA does not apply to long-term gains, so LTCG bands have no payroll ribbons); payroll tax also appears as its own band beside ordinary brackets under ordinary taxable. Any remainder or from income rows as a fallback. Short-term capital gains still show as their own income stream on
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
