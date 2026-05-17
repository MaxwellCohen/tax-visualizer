import { Accessor, Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
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
        <p class="mb-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          How to read this: each income row on the left flows into ordinary or
          long-term taxable income (by source), then follow the flows into
          pre-tax payroll benefits, deductions, federal tax buckets, taxes,
          federal credits (when entered — drawn from the highest marginal-rate
          slice first), separate federal-tax and payroll-tax bars, and a single
          take-home bar. The &quot;shielded income&quot; path is a visual
          explanation of income removed by deductions and payroll pre-tax
          amounts, not a literal cash account. Payroll tax ribbons attach only
          to ordinary / LTCG ordinary bracket paths only (FICA does not apply to
          long-term gains, so LTCG bands have no payroll ribbons); payroll tax
          also appears as its own band beside ordinary brackets under ordinary
          taxable. Any remainder or from income rows as a fallback. Short-term
          capital gains still show as their own income stream on the left, but
          federal tax on them is not a separate band: the IRS taxes them as
          ordinary income, so that tax is included in the ordinary bracket
          slices (and any NIIT share in those slices&apos; totals).
        </p>
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
