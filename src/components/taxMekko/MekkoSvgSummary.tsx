import { Show } from "solid-js";
import type { TaxResult } from "~/lib/taxCalc";
import { PAD_L, PAD_T, SUMMARY_H, pct } from "~/components/taxMekko/constants";
import { money } from "~/lib/moneyFormat";
import type { MekkoLayout } from "~/components/taxMekko/mekkoLayout";

type Props = {
  L: MekkoLayout;
  result: TaxResult;
};

export function MekkoSvgSummary(props: Props) {
  const L = props.L;
  return (
    <>
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
    </>
  );
}
