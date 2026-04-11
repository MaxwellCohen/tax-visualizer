import type { MekkoLayout } from "~/components/taxMekko/mekkoLayout";
import { MekkoSvgIncomeAxis } from "~/components/taxMekko/MekkoSvgIncomeAxis";
import { MekkoSvgPercentAxis } from "~/components/taxMekko/MekkoSvgPercentAxis";

type Props = { L: MekkoLayout };

export function MekkoSvgAxes(props: Props) {
  return (
    <>
      <MekkoSvgPercentAxis L={props.L} />
      <MekkoSvgIncomeAxis L={props.L} />
    </>
  );
}
