import { Show, splitProps, type Accessor, type Component, type JSX } from "solid-js";
import Accordion from "~/components/ui/Accordion";
import { money } from "~/lib/format/moneyFormat";
import {
  LineItemsTableBlock,
  type LineItemsTableBlockProps,
} from "~/components/tax/inputForm/sections/LineItemsTableBlock";

export type LineItemsAccordionSectionProps = LineItemsTableBlockProps & {
  title: string;
  summaryAmount: Accessor<number>;
  leading?: JSX.Element;
};

export const LineItemsAccordionSection: Component<LineItemsAccordionSectionProps> = (props) => {
  const [panel, table] = splitProps(props, ["title", "summaryAmount", "leading"]);

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
            {panel.title}
          </h2>
          <span class="text-sm tabular-nums text-muted-foreground">{money.format(panel.summaryAmount())}</span>
        </>
      }
      bodyClass="space-y-4"
    >
      <Show when={panel.leading}>{panel.leading}</Show>
      <LineItemsTableBlock {...table} />
    </Accordion>
  );
};
