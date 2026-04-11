import type { TaxResult } from "~/lib/taxCalc";
import { H, W } from "~/components/taxMekko/constants";
import { MekkoSvgAxes } from "~/components/taxMekko/MekkoSvgAxes";
import { MekkoSvgBands } from "~/components/taxMekko/MekkoSvgBands";
import { MekkoSvgSummary } from "~/components/taxMekko/MekkoSvgSummary";
import type { MekkoLayout } from "~/components/taxMekko/mekkoLayout";

type Props = {
  L: MekkoLayout;
  result: TaxResult;
};

export function MekkoChartSvg(props: Props) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class="w-full rounded-lg"
      overflow="visible"
      style={{
        background: "var(--surface-alt)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <MekkoSvgSummary L={props.L} result={props.result} />
      <MekkoSvgAxes L={props.L} />
      <MekkoSvgBands L={props.L} />
    </svg>
  );
}
