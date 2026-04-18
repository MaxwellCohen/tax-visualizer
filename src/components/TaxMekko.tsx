import { Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import { buildMekkoFromConfig } from "~/lib/taxCharts.buildMekko";
import { MekkoChartSvg } from "~/components/taxMekko/MekkoChartSvg";
import { computeMekkoLayout } from "~/components/taxMekko/mekkoLayout";

type TaxMekkoProps = {
  calculatedConfig: CalculatedConfigItem[] | null;
};

export default function TaxMekko(props: TaxMekkoProps) {
  const layout = createMemo(() => {
    if (!props.calculatedConfig) return undefined;
    const rows = buildMekkoFromConfig(props.calculatedConfig);
    return computeMekkoLayout(props.calculatedConfig, rows);
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
          How to read this: the <strong>left axis is gross income</strong> (same as “Total Income”).
          From bottom to top, bands are <strong>pre-tax deferrals</strong>, the <strong>½ SE tax</strong>{" "}
          deduction (if any), <strong>deduction shield</strong> (standard/itemized on ordinary, net of
          wage payroll taxes carved out), <strong>wage payroll taxes</strong> (FICA taken from that same
          shield pool), then <strong>ordinary federal brackets</strong> (green / red), then{" "}
          <strong>long-term gains</strong>. Together they fill gross. The line under the summary bar shows
          total payroll tax and federal credits. The bar above is take-home vs pre-tax deferrals vs all
          taxes (income + payroll).
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
          {L => <MekkoChartSvg L={L} />}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
