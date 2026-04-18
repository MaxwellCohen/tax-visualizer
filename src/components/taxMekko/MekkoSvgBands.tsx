import { For, Show } from "solid-js";
import { money } from "~/lib/moneyFormat";
import type { MekkoLayout } from "~/components/taxMekko/mekkoLayout";
import type { MekkoRow } from "~/lib/taxCharts.buildMekko";

type Props = {
  L: MekkoLayout;
};

function bandTitle(row: MekkoRow): string {
  if (row.kind === "pretax") {
    return `${row.label}: ${money.format(row.total)} deferred (payroll pre-tax & deductible IRA).`;
  }
  if (row.kind === "seAdjustment") {
    return `${row.label}: ${money.format(row.total)} deductible against ordinary income (not cash).`;
  }
  if (row.kind === "payrollTax") {
    return `${row.label}: ${money.format(row.total)} wage Social Security & Medicare (carved from the same pool as the deduction shield).`;
  }
  if (row.kind === "deduction") {
    return `${row.label}: ${money.format(row.total)} shielded by standard or itemized deduction (not taxed as ordinary), after payroll carve-out.`;
  }
  if (row.kind === "ltcgBracket") {
    return `${row.label}: preferential federal tax ${money.format(row.tax)}; ${money.format(row.keep)} of this slice remains before payroll tax.`;
  }
  return `${row.label}: federal tax ${money.format(row.tax)}; ${money.format(row.keep)} of this slice remains before payroll tax.`;
}

function bandFill(row: MekkoRow): string {
  if (row.kind === "deduction") return "var(--mekko-deduction)";
  if (row.kind === "payrollTax") return "var(--mekko-tax)";
  if (row.kind === "pretax" || row.kind === "seAdjustment") return "var(--mekko-pretax)";
  if (row.kind === "ltcgBracket") return "var(--mekko-ltcg)";
  return "var(--mekko-keep)";
}

export function MekkoSvgBands(props: Props) {
  const L = props.L;
  return (
    <For each={L.rowLayouts}>
      {item => {
        const { row, rowTop, rowH, keepW, taxW } = item;
        const labelMidY = rowTop + rowH / 2 + 4;
        const bracketTitle = bandTitle(row);
        return (
          <g>
            <text
              x={L.plotLeft - 10}
              y={labelMidY}
              text-anchor="end"
              font-size="11"
              font-family="var(--font-body)"
              fill="var(--sankey-label)"
            >
              {row.label}
            </text>
            <rect
              x={L.plotLeft}
              y={rowTop}
              width={Math.max(0, keepW)}
              height={rowH}
              fill={bandFill(row)}
              stroke="var(--border-subtle)"
              stroke-width={0.5}
            >
              <title>{bracketTitle}</title>
            </rect>
            <Show when={taxW > 0}>
              <rect
                x={L.plotLeft + keepW}
                y={rowTop}
                width={Math.max(0, taxW)}
                height={rowH}
                fill="var(--mekko-tax)"
                stroke="var(--border-subtle)"
                stroke-width={0.5}
              >
                <title>{bracketTitle}</title>
              </rect>
            </Show>
            <Show when={keepW >= 52 && rowH >= 16}>
              <text
                x={L.plotLeft + keepW / 2}
                y={labelMidY}
                fill="var(--mekko-segment-label)"
                style={{
                  "text-anchor": "middle",
                  "font-size": `${rowH < 22 ? 9 : 10}px`,
                  "font-family": "var(--font-body)",
                }}
              >
                {money.format(row.keep)}
              </text>
            </Show>
            <Show when={taxW >= 52 && rowH >= 16}>
              <text
                x={L.plotLeft + keepW + taxW / 2}
                y={labelMidY}
                fill="var(--mekko-segment-label)"
                style={{
                  "text-anchor": "middle",
                  "font-size": `${rowH < 22 ? 9 : 10}px`,
                  "font-family": "var(--font-body)",
                }}
              >
                {money.format(row.tax)}
              </text>
            </Show>
          </g>
        );
      }}
    </For>
  );
}
