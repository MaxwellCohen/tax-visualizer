import { For, Show } from "solid-js";
import { money } from "~/lib/moneyFormat";
import type { MekkoLayout } from "~/components/taxMekko/mekkoLayout";

type Props = {
  L: MekkoLayout;
};

export function MekkoSvgBands(props: Props) {
  const L = props.L;
  return (
    <For each={L.rowLayouts}>
      {item => {
        const { row, rowTop, rowH, keepW, taxW } = item;
        const labelMidY = rowTop + rowH / 2 + 4;
        const bracketTitle =
          row.kind === "deduction"
            ? `${row.label}: ${money.format(row.total)} shielded by deduction (not taxed).`
            : row.kind === "ltcgBracket"
              ? `${row.label}: preferential federal tax ${money.format(row.tax)}; ${money.format(row.keep)} of this slice remains before payroll tax.`
              : `${row.label} bracket slice: federal tax ${money.format(row.tax)}; ${money.format(row.keep)} of this slice remains before payroll tax.`;
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
              fill={
                row.kind === "deduction"
                  ? "var(--mekko-deduction)"
                  : row.kind === "pretax"
                    ? "var(--mekko-pretax)"
                    : row.kind === "ltcgBracket"
                      ? "var(--mekko-ltcg)"
                      : "var(--mekko-keep)"
              }
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
