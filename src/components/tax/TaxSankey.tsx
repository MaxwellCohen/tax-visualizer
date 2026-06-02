import { Accessor, Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import { SankeyHowToRead } from "~/components/tax/sankey/SankeyHowToRead";
import { SankeyChartSvg } from "~/components/tax/sankey/svg/SankeyChartSvg";
import { buildSankeyLayoutFromCalculatedConfig } from "~/components/tax/sankey/buildSankeyLayoutFromCalculatedConfig";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";

type TaxSankeyProps = {
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

export default function TaxSankey(props: TaxSankeyProps) {
  const sankeyData = createMemo(() => buildSankeyLayoutFromCalculatedConfig(props.calculatedConfig()));

  return (
    <section class="rounded-xl border border-border bg-surface p-5 shadow-card">
      <CollapsibleBlock title="Tax Flow" bodyClass="mt-4">
        <SankeyHowToRead />
        <Show
          keyed
          when={sankeyData()}
          fallback={
            <p class="text-sm text-faint-foreground">
              Enter income to see the flow.
            </p>
          }
        >
          {(data) => <SankeyChartSvg graph={data} />}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
