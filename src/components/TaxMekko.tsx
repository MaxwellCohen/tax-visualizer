import { Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import type { TaxResult } from "~/lib/taxForm.types";
import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import { buildMekkoRows } from "~/lib/taxCharts";
import { MekkoChartSvg } from "~/components/taxMekko/MekkoChartSvg";
import { computeMekkoLayout } from "~/components/taxMekko/mekkoLayout";

type TaxMekkoProps = {
  result: TaxResult;
  calculatedConfig: CalculatedConfigItem[] | null;
};

export default function TaxMekko(props: TaxMekkoProps) {
  const layout = createMemo(() => {
    const rows = props.result.display?.mekko.rows ?? buildMekkoRows(props.result);
    return computeMekkoLayout(props.result, rows);
  });

  return (
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <CollapsibleBlock title="Income & federal brackets (Mekko)" bodyClass="mt-4">
        <p class="mb-4 max-w-3xl text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          How to read this: each horizontal band is a slice of gross income. A band can be a
          deduction, an <strong>ordinary</strong> federal bracket slice (wages, other income,
          short-term gains), or a <strong>long-term gain</strong> bucket (0% / 15% / 20%, separate
          from ordinary rates). Width shows federal tax on that slice versus what remains before
          payroll tax. The top bar is a high-level split of gross income into modeled take-home cash,
          payroll pre-tax / IRA contributions, and taxes.
        </p>
        <Show
          keyed
          when={layout()}
          fallback={
            <p class="text-sm" style={{ color: "var(--text-faint)" }}>
              Enter income to see the chart.
            </p>
          }
        >
          {L => <MekkoChartSvg L={L} result={props.result} />}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
