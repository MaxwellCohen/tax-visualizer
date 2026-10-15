import { Show, omit, type Accessor, type Component } from "solid-js";
import type { JSX } from "@solidjs/web";
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
  const table = omit(props, "title", "summaryAmount", "leading");

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-faint-foreground font-heading">
            {props.title}
          </h2>
          <span class="text-sm tabular-nums text-muted-foreground">{money.format(props.summaryAmount())}</span>
        </>
      }
      bodyClass="space-y-4"
    >
      <Show when={props.leading}>{props.leading}</Show>
      <LineItemsTableBlock {...table} />
    </Accordion>
  );
};
