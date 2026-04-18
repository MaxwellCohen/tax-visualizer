import type { MekkoLayout } from "~/components/taxMekko/mekkoLayout";
import { H, W } from "~/components/taxMekko/constants";
import { MekkoSvgAxes } from "~/components/taxMekko/MekkoSvgAxes";
import { MekkoSvgBands } from "~/components/taxMekko/MekkoSvgBands";
import { MekkoSvgSummary } from "~/components/taxMekko/MekkoSvgSummary";

type Props = {
  L: MekkoLayout;
};

export function MekkoChartSvg(props: Props) {

  console.log("MekkoChartSvg", props);
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
      <MekkoSvgSummary L={props.L} />
      <MekkoSvgAxes L={props.L} />
      <MekkoSvgBands L={props.L} />
    </svg>
  );
}
