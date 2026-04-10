import { For, Show, createMemo } from "solid-js";
import type { TaxResult } from "~/lib/taxCalc";
import type { MekkoRow } from "~/lib/taxCharts";

type TaxMekkoProps = {
  result: TaxResult;
  rows: MekkoRow[];
};

const W = 920;
const H = 560;
const PAD_L = 102;
const PAD_R = 20;
const PAD_B = 52;
const PAD_T = 28;
const SUMMARY_H = 20;
const SUMMARY_GAP = 12;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Round `x` to a readable step (1, 2, 5, 10 × 10^n). Used for income axis ticks.
 */
function niceStep(x: number, round: boolean): number {
  if (x <= 0 || !Number.isFinite(x)) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf: number;
  if (round) {
    if (f < 1.5) nf = 1;
    else if (f < 3) nf = 2;
    else if (f < 7) nf = 5;
    else nf = 10;
  } else {
    if (f <= 1) nf = 1;
    else if (f <= 2) nf = 2;
    else if (f <= 5) nf = 5;
    else nf = 10;
  }
  return nf * 10 ** exp;
}

/**
 * Y-axis domain and ticks derived together: step scales with income, tick count scales with plot height.
 */
function incomeYAxis(visualTotal: number, plotH: number): { yMax: number; yTicks: number[] } {
  const dataMax = Math.max(visualTotal * 1.06, 1);
  const targetIntervals = Math.max(3, Math.min(8, Math.round(plotH / 52)));
  let step = niceStep(dataMax / targetIntervals, true);
  let yMax = Math.max(step, Math.ceil(dataMax / step) * step);
  let intervals = Math.round(yMax / step);
  while (intervals > targetIntervals + 1) {
    step = niceStep(step * 2, true);
    yMax = Math.max(step, Math.ceil(dataMax / step) * step);
    intervals = Math.round(yMax / step);
  }
  const yTicks: number[] = [];
  for (let i = 0; i <= intervals; i++) {
    yTicks.push(Math.round(step * i));
  }
  return { yMax, yTicks };
}

function incomeY(plotTop: number, plotH: number, yMax: number, income: number): number {
  return plotTop + plotH - (income / yMax) * plotH;
}

export default function TaxMekko(props: TaxMekkoProps) {
  const layout = createMemo(() => {
    const r = props.result;
    const totalIncome = r.totalIncome;
    const rows = props.rows;
    if (rows.length === 0) return undefined;

    const stackTotal = rows.reduce((s, row) => s + row.total, 0);
    const visualTotal = Math.max(totalIncome, stackTotal);
    if (visualTotal <= 0) return undefined;

    const plotTop = PAD_T + SUMMARY_H + SUMMARY_GAP;
    const plotBottom = H - PAD_B;
    const plotLeft = PAD_L;
    const plotRight = W - PAD_R;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;
    const { yMax, yTicks } = incomeYAxis(visualTotal, plotH);

    const takeShare = totalIncome > 0 ? r.takeHomePay / totalIncome : 0;
    const pretaxShare =
      totalIncome > 0 ? (r.preTaxTotal + r.traditionalIra) / totalIncome : 0;
    const taxShare =
      totalIncome > 0 ? (r.federalIncomeTax + r.payrollTax) / totalIncome : 0;

    let cumulative = 0;
    const rowLayouts = rows.map((row: MekkoRow) => {
      const y0 = incomeY(plotTop, plotH, yMax, cumulative);
      cumulative += row.total;
      const y1 = incomeY(plotTop, plotH, yMax, cumulative);
      const rowTop = Math.min(y0, y1);
      const rowH = Math.max(1, Math.abs(y1 - y0));
      const keepFrac = row.total > 0 ? row.keep / row.total : 0;
      const taxFrac = row.total > 0 ? row.tax / row.total : 0;
      const keepW = keepFrac * plotW;
      const taxW = taxFrac * plotW;
      return { row, rowTop, rowH, keepW, taxW, keepFrac, taxFrac };
    });

    return {
      plotTop,
      plotBottom,
      plotLeft,
      plotRight,
      plotW,
      plotH,
      yMax,
      yTicks,
      takeShare,
      pretaxShare,
      taxShare,
      rowLayouts,
    };
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
        class="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
      >
        Income &amp; federal brackets (Mekko)
      </h2>
      <p class="mb-4 max-w-3xl text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        How to read this: each horizontal band is a slice of gross income. A band can be a
        deduction, an <strong>ordinary</strong> federal bracket slice (wages, other income,
        short-term gains), or a <strong>long-term gain</strong> bucket (0% / 15% / 20%, separate
        from ordinary rates). Width shows federal tax on that slice versus what remains before
        payroll tax. The top bar is a high-level split of gross income into modeled take-home cash,
        payroll pre-tax / IRA contributions, and taxes.
      </p>
      <Show
        keyed
        when={layout()}
        fallback={
          <p class="text-sm" style={{ color: "var(--text-faint)" }}>
            Enter income to see the chart.
          </p>
        }
      >
        {L => (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            class="w-full rounded-lg"
            overflow="visible"
            style={{
              background: "var(--surface-alt)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <text
              x={PAD_L - 8}
              y={18}
              text-anchor="end"
              font-size="10"
              font-family="var(--font-body)"
              fill="var(--text-muted)"
            >
              Cash, pre-tax &amp; taxes (share of gross)
            </text>
            <g transform={`translate(${L.plotLeft}, ${PAD_T})`}>
              <rect
                x={0}
                y={0}
                width={L.takeShare * L.plotW}
                height={SUMMARY_H}
                fill="var(--mekko-keep)"
                rx={2}
              >
                <title>{`Take-home pay ${money.format(props.result.takeHomePay)} (${pct.format(L.takeShare)})`}</title>
              </rect>
              <rect
                x={L.takeShare * L.plotW}
                y={0}
                width={L.pretaxShare * L.plotW}
                height={SUMMARY_H}
                fill="var(--mekko-pretax)"
                rx={2}
              >
                <title>{`Payroll pre-tax & deductible IRA ${money.format(props.result.preTaxTotal + props.result.traditionalIra)} (${pct.format(L.pretaxShare)})`}</title>
              </rect>
              <rect
                x={(L.takeShare + L.pretaxShare) * L.plotW}
                y={0}
                width={L.taxShare * L.plotW}
                height={SUMMARY_H}
                fill="var(--mekko-tax)"
                rx={2}
              >
                <title>{`Taxes ${money.format(props.result.federalIncomeTax + props.result.payrollTax)} (${pct.format(L.taxShare)})`}</title>
              </rect>
              <Show when={L.takeShare * L.plotW > 56}>
                <text
                  x={(L.takeShare * L.plotW) / 2}
                  y={SUMMARY_H / 2 + 4}
                  text-anchor="middle"
                  font-size="10"
                  font-family="var(--font-body)"
                  fill="var(--mekko-segment-label)"
                >
                  {pct.format(L.takeShare)}
                </text>
              </Show>
              <Show when={L.pretaxShare * L.plotW > 56}>
                <text
                  x={L.takeShare * L.plotW + (L.pretaxShare * L.plotW) / 2}
                  y={SUMMARY_H / 2 + 4}
                  text-anchor="middle"
                  font-size="10"
                  font-family="var(--font-body)"
                  fill="var(--mekko-segment-label)"
                >
                  {pct.format(L.pretaxShare)}
                </text>
              </Show>
              <Show when={L.taxShare * L.plotW > 56}>
                <text
                  x={(L.takeShare + L.pretaxShare) * L.plotW + (L.taxShare * L.plotW) / 2}
                  y={SUMMARY_H / 2 + 4}
                  text-anchor="middle"
                  font-size="10"
                  font-family="var(--font-body)"
                  fill="var(--mekko-segment-label)"
                >
                  {pct.format(L.taxShare)}
                </text>
              </Show>
            </g>

            <line
              x1={L.plotLeft}
              y1={L.plotBottom}
              x2={L.plotRight}
              y2={L.plotBottom}
              stroke="var(--border)"
              stroke-width={1}
            />
            <For each={[0, 20, 40, 60, 80, 100]}>
              {tick => {
                const x = L.plotLeft + (tick / 100) * L.plotW;
                return (
                  <g>
                    <line
                      x1={x}
                      y1={L.plotBottom}
                      x2={x}
                      y2={L.plotBottom + 5}
                      stroke="var(--border)"
                      stroke-width={1}
                    />
                    <text
                      x={x}
                      y={L.plotBottom + 20}
                      text-anchor="middle"
                      font-size="10"
                      font-family="var(--font-body)"
                      fill="var(--text-muted)"
                    >
                      {`${tick}%`}
                    </text>
                  </g>
                );
              }}
            </For>
            <text
              x={(L.plotLeft + L.plotRight) / 2}
              y={H - 12}
              text-anchor="middle"
              font-size="11"
              font-family="var(--font-body)"
              fill="var(--text-muted)"
            >
              Share of that row (federal tax vs remainder of slice)
            </text>

            <line
              x1={L.plotLeft}
              y1={L.plotTop}
              x2={L.plotLeft}
              y2={L.plotBottom}
              stroke="var(--border)"
              stroke-width={1}
            />
            <For each={L.yTicks}>
              {v => {
                const y = incomeY(L.plotTop, L.plotH, L.yMax, v);
                return (
                  <g>
                    <line
                      x1={L.plotLeft - 5}
                      y1={y}
                      x2={L.plotLeft}
                      y2={y}
                      stroke="var(--border)"
                      stroke-width={1}
                    />
                    <text
                      x={L.plotLeft - 8}
                      y={y + 4}
                      text-anchor="end"
                      font-size="10"
                      font-family="var(--font-body)"
                      fill="var(--text-muted)"
                    >
                      {v >= 1000 ? `${Math.round(v / 1000)}k` : money.format(v)}
                    </text>
                  </g>
                );
              }}
            </For>
            <text
              x={12}
              y={(L.plotTop + L.plotBottom) / 2}
              text-anchor="middle"
              font-size="11"
              font-family="var(--font-body)"
              fill="var(--text-muted)"
              transform={`rotate(-90, 12, ${(L.plotTop + L.plotBottom) / 2})`}
            >
              Income ($)
            </text>

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
                        text-anchor="middle"
                        font-size={rowH < 22 ? 9 : 10}
                        font-family="var(--font-body)"
                        fill="var(--mekko-segment-label)"
                      >
                        {money.format(row.keep)}
                      </text>
                    </Show>
                    <Show when={taxW >= 52 && rowH >= 16}>
                      <text
                        x={L.plotLeft + keepW + taxW / 2}
                        y={labelMidY}
                        text-anchor="middle"
                        font-size={rowH < 22 ? 9 : 10}
                        font-family="var(--font-body)"
                        fill="var(--mekko-segment-label)"
                      >
                        {money.format(row.tax)}
                      </text>
                    </Show>
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
