import { For } from "solid-js";
import { money } from "~/lib/moneyFormat";
import { incomeY } from "~/components/taxMekko/incomeScale";
import type { MekkoLayout } from "~/components/taxMekko/mekkoLayout";

type Props = { L: MekkoLayout };

export function MekkoSvgIncomeAxis(props: Props) {
  const L = props.L;
  return (
    <>
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
    </>
  );
}
