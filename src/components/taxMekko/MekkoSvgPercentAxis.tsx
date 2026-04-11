import { For } from "solid-js";
import { H } from "~/components/taxMekko/constants";
import type { MekkoLayout } from "~/components/taxMekko/mekkoLayout";

type Props = { L: MekkoLayout };

export function MekkoSvgPercentAxis(props: Props) {
  const L = props.L;
  return (
    <>
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
    </>
  );
}
