import { For, Show, createMemo } from "solid-js";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyGraph, SankeyLinkMinimal, SankeyNodeMinimal } from "d3-sankey";
import {
  INCOME_KIND_CHART_ORDER,
  type SankeyChartData,
  type SankeyChartNode,
} from "~/lib/taxCharts";

interface ChartNode extends SankeyNodeMinimal<ChartNode, ChartLink>, SankeyChartNode {}

interface ChartLink extends SankeyLinkMinimal<ChartNode, ChartLink> {
  source: string | ChartNode;
  target: string | ChartNode;
  value: number;
}

/** d3-sankey horizontal tangents; avoids straight segments while keeping a left-to-right S-curve. */
const sankeyLinkPath = sankeyLinkHorizontal<ChartNode, ChartLink>();

type TaxSankeyProps = {
  data: SankeyChartData;
};

const width = 920;
const height = 600;
const LABEL_RIGHT_RESERVE = 340;

/**
 * Vertical order for d3-sankey sibling sort: lower number = higher on the chart.
 * Adjust ranks here to reorder flows (same-depth nodes are never compared across depths).
 *
 * Gross → outflows: long-term taxable → ordinary taxable → deduction path (standard benchmark + itemized
 * when applicable), then pre-tax rows (401(k) / HSA / other / traditional IRA) at the bottom.
 *
 * Bracket column: LTCG above ordinary, then shielded income.
 * Rightmost column (sinks): taxes above take-home, then 401(k) / HSA / other / IRA deferred sinks at the bottom.
 */
const SANKEY_SIBLING_RANK: Record<ChartNode["kind"], number> = {
  grossIncome: 0,
  incomeSource: 1,
  longTermTaxableIncome: 2,
  ordinaryTaxableIncome: 3,
  standardDeduction: 4,
  deduction: 5,
  pretaxContribution: 6,
  ltcgBracket: 7,
  ordinaryBracket: 8,
  deductionShield: 9,
  taxes: 10,
  keep: 11,
  deferredSink: 12,
};

function compareSankeySiblings(a: ChartNode, b: ChartNode): number {
  if (a.kind === "ordinaryTaxableIncome" && b.kind === "longTermTaxableIncome") return 1;
  if (a.kind === "longTermTaxableIncome" && b.kind === "ordinaryTaxableIncome") return -1;

  if (a.kind === "incomeSource" && b.kind === "incomeSource") {
    const ka = a.incomeKind;
    const kb = b.incomeKind;
    if (ka && kb) {
      const kindDiff = INCOME_KIND_CHART_ORDER[ka] - INCOME_KIND_CHART_ORDER[kb];
      if (kindDiff !== 0) return kindDiff;
    }
    return a.label.localeCompare(b.label);
  }

  if (a.kind === "ordinaryBracket" && b.kind === "ordinaryBracket") {
    const rateDiff = (b.marginalRate ?? 0) - (a.marginalRate ?? 0);
    if (rateDiff !== 0) return rateDiff;
    const startDiff = (b.rangeStart ?? 0) - (a.rangeStart ?? 0);
    if (startDiff !== 0) return startDiff;
    return a.label.localeCompare(b.label);
  }

  if (a.kind === "ltcgBracket" && b.kind === "ltcgBracket") {
    const rateDiff = (b.marginalRate ?? 0) - (a.marginalRate ?? 0);
    if (rateDiff !== 0) return rateDiff;
    return a.label.localeCompare(b.label);
  }

  if (a.kind === "deferredSink" && b.kind === "deferredSink") {
    return a.label.localeCompare(b.label);
  }

  return SANKEY_SIBLING_RANK[a.kind] - SANKEY_SIBLING_RANK[b.kind];
}

function isBracketNode(node: ChartNode): boolean {
  return node.kind === "ordinaryBracket" || node.kind === "ltcgBracket";
}

function nodeFlowValue(node: ChartNode): number {
  return node.amount ?? node.value ?? 0;
}

function compactNodeLabel(node: ChartNode): string {
  if (node.kind === "deferredSink") {
    if (node.label.includes("401(k)")) return "401(k)";
    if (node.label.includes("HSA")) return "HSA";
    if (node.label.includes("IRA")) return "IRA";
    if (node.label.includes("Other")) return "Other";
  }

  if (node.kind === "pretaxContribution") {
    if (node.label === "Other pre-tax") return "Other";
    if (node.label.includes("IRA")) return "IRA";
  }

  return node.label;
}

type SankeyLabelLines = {
  title: string;
  compact: boolean;
  line1: string;
  line2?: string;
};

function sankeyLabelLines(node: ChartNode): SankeyLabelLines {
  const flow = nodeFlowValue(node);
  const fmt = money.format(flow);
  const y0 = node.y0 ?? 0;
  const y1 = node.y1 ?? 0;
  const h = Math.max(0, y1 - y0);

  if (node.kind === "standardDeduction") {
    const title = `${node.label} for this filing status is ${fmt}. The flow through this bar is your itemized amount (next step), so band width matches itemized dollars, not this benchmark.`;
    if (h < 30) {
      return { compact: true, title, line1: `Std · ${fmt}` };
    }
    return { compact: false, title, line1: "Standard (benchmark)", line2: fmt };
  }

  if (isBracketNode(node)) {
    const slice = node.incomeAmount ?? flow;
    const tax = node.taxAmount ?? 0;
    const net = Math.max(0, slice - tax);
    const sliceFmt = money.format(slice);
    const ratePct = Math.round((node.marginalRate ?? 0) * 100);
    const line1 = node.kind === "ltcgBracket" ? `LTCG ${ratePct}%` : `${ratePct}%`;
    const title = `${node.label}. This slice ${sliceFmt}; federal tax ${money.format(tax)}; ${money.format(net)} net of this bracket (before payroll).`;
    if (h < 34) {
      return { compact: true, title, line1: `${line1} · ${sliceFmt}` };
    }
    return { compact: false, title, line1, line2: sliceFmt };
  }

  const title = `${node.label}, ${fmt}`;
  if (h < 28) {
    return { compact: true, title, line1: `${compactNodeLabel(node)} · ${fmt}` };
  }
  return { compact: false, title, line1: compactNodeLabel(node), line2: fmt };
}

function linkStroke(targetNode: ChartNode): string {
  if (targetNode.kind === "taxes") return "var(--sankey-link-tax)";
  if (targetNode.kind === "keep") return "var(--sankey-link-keep)";
  if (targetNode.kind === "deferredSink") return "var(--sankey-link-deferred)";
  return "var(--sankey-link)";
}

function compareLinkedNodes(a: ChartNode, b: ChartNode): number {
  const rankDiff = compareSankeySiblings(a, b);
  if (rankDiff !== 0) return rankDiff;
  return a.label.localeCompare(b.label);
}

function compareSankeyLinks(a: ChartLink, b: ChartLink): number {
  const sourceA = a.source as ChartNode;
  const sourceB = b.source as ChartNode;
  const targetA = a.target as ChartNode;
  const targetB = b.target as ChartNode;

  if (sourceA === sourceB) {
    return compareLinkedNodes(targetA, targetB);
  }

  if (targetA === targetB) {
    return compareLinkedNodes(sourceA, sourceB);
  }

  const sourceDiff = compareLinkedNodes(sourceA, sourceB);
  if (sourceDiff !== 0) return sourceDiff;
  return compareLinkedNodes(targetA, targetB);
}

function nodeFill(node: ChartNode): string {
  switch (node.kind) {
    case "grossIncome":
      return "var(--sankey-node-1)";
    case "incomeSource":
      return "var(--sankey-node-income)";
    case "ordinaryTaxableIncome":
      return "var(--sankey-node-3)";
    case "longTermTaxableIncome":
    case "ltcgBracket":
      return "var(--sankey-node-ltcg)";
    case "standardDeduction":
    case "deduction":
      return "var(--sankey-node-2)";
    case "deductionShield":
      return "var(--sankey-node-5)";
    case "ordinaryBracket":
      return "var(--sankey-node-4)";
    case "taxes":
      return "var(--sankey-node-6)";
    case "keep":
    case "pretaxContribution":
      return "var(--sankey-node-keep)";
    case "deferredSink":
      return "var(--sankey-node-deferred)";
    default:
      return "var(--sankey-node-7)";
  }
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function TaxSankey(props: TaxSankeyProps) {
  const sankeyData = createMemo(() => {
    const clonedNodes: ChartNode[] = props.data.nodes.map(node => ({ ...node }));
    const clonedLinks: ChartLink[] = props.data.links
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
        [width - 8, height - 8],
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
      <h2
        class="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Tax Flow
      </h2>
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
        {data => (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            class="w-full rounded-lg"
            overflow="visible"
            style={{
              background: "var(--surface-alt)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <For each={data.graph.links}>
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
                    <title>{`${(link.source as ChartNode).label} → ${targetNode.label}: ${money.format(link.value ?? 0)}`}</title>
                  </path>
                );
              }}
            </For>

            <For each={data.graph.nodes}>
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
          </svg>
        )}
      </Show>
    </section>
  );
}
