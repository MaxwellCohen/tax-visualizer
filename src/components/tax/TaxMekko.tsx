import { Accessor, For, Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";
import {
  buildMekkoFromConfig,
  type MekkoChartData,
} from "~/lib/tax/charts/buildMekko";
import { money } from "~/lib/format/moneyFormat";

type TaxMekkoProps = {
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function share(value: number, total: number): number {
  return total > 0 ? Math.max(0, value / total) : 0;
}

const zeroMoneyLabel = money.format(0);

function currencyLabelUnlessZeroDisplay(amount: number): string {
  const formatted = money.format(amount);
  return formatted === zeroMoneyLabel ? "" : formatted;
}

function MekkoSummary(props: { data: MekkoChartData }) {
  const d = props.data;
  const summary = d.summary;

  return (
    <div class="mb-4">
      <div class="text-center text-[10px] text-muted-foreground">
        Cash, pre-tax & taxes (share of gross)
      </div>
      <div class="mb-2 text-center text-[9px] text-faint-foreground">
        {`Payroll tax ${money.format(d.payrollTax)}${
          d.federalTaxCreditsApplied > 0
            ? ` · Federal credits applied ${money.format(d.federalTaxCreditsApplied)}`
            : ""
        }`}
      </div>
      {/* Same w-32 + flex-1 chart layout as MekkoRows so shares align with band segments */}
      <div class="flex items-stretch">
        <div class="w-32 shrink-0" aria-hidden="true" />
        <div class="flex h-5 min-w-0 flex-1 overflow-hidden rounded-sm">
          <div
            class="flex items-center justify-center bg-sankey-link-keep text-[10px] text-mekko-segment-label"
            style={{ width: `${summary.takeHomeShare * 100}%` }}
            title={`Take-home pay ${money.format(d.takeHomePay)} (${pct.format(summary.takeHomeShare)})`}
          >
            {summary.takeHomeShare ? pct.format(summary.takeHomeShare) : ""}
          </div>
          <div
            class="flex items-center justify-center bg-chart-pretax text-[10px]"
            style={{ width: `${summary.pretaxShare * 100}%` }}
            title={`Payroll pre-tax & deductible IRA ${money.format(summary.pretaxTotal)} (${pct.format(summary.pretaxShare)})`}
          >
            {summary.pretaxShare ? pct.format(summary.pretaxShare) : ""}
          </div>
          <div
            class="flex items-center justify-center bg-chart-tax text-[10px]"
            style={{ width: `${summary.taxShare * 100}%` }}
            title={`Taxes ${money.format(summary.taxTotal)} (${pct.format(summary.taxShare)})`}
          >
            {summary.taxShare ? pct.format(summary.taxShare) : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function MekkoRows(props: { data: MekkoChartData }) {
  const d = props.data;
  const stackedTotal = d.rows.reduce((sum, row) => sum + row.total, 0);
  const visualTotal = d.totalIncome > 0 ? d.totalIncome : stackedTotal;

  return (
    <div class="flex h-110 flex-col-reverse rounded-lg border border-border-subtle">
      <For each={d.rows}>
        {(row) => {
          const keepShare = share(row.keep, row.total);
          const taxShare = share(row.tax, row.total);
          const rowShare = share(row.total, visualTotal);

          return (
            <div
              class="flex min-h-4.5 items-stretch"
              style={{ height: `${rowShare * 100}%` }}
            >
              <div class="flex w-32 shrink-0 items-center justify-end pr-3 text-right text-[11px] text-sankey-label">
                {row.label}
              </div>
              <div class="flex min-w-0 flex-1">
                <div
                  class="flex items-center justify-center text-[10px] text-mekko-segment-label"
                  style={{
                    width: `${keepShare * 100}%`,
                    background: row.fill,
                    border: `0.5px solid ${row.stroke}`,
                  }}
                  title={row.title}
                >
                  {currencyLabelUnlessZeroDisplay(row.keep)}
                </div>
                <Show when={money.format(row.tax) !== zeroMoneyLabel}>
                  <div
                    class="flex items-center justify-center text-[10px] text-mekko-segment-label"
                    style={{
                      width: `${taxShare * 100}%`,
                      background: row.taxFill,
                      border: `0.5px solid ${row.taxStroke}`,
                    }}
                    title={row.title}
                  >
                    {currencyLabelUnlessZeroDisplay(row.tax)}
                  </div>
                </Show>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}

export default function TaxMekko(props: TaxMekkoProps) {
  const chartData = createMemo(() => {
    const calculatedConfig = props.calculatedConfig();
    if (!calculatedConfig) return undefined;
    return buildMekkoFromConfig(calculatedConfig);
  });

  return (
    <section class="rounded-xl border border-border bg-surface p-5 shadow-card">
      <CollapsibleBlock
        title="Income & federal brackets (Mekko)"
        bodyClass="mt-4"
      >
        <p class="mb-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Bottom to top is gross income. Green is what you keep in that band;
          red is federal tax. The bar above compares take-home, pretax amounts,
          and taxes (income + Social Security/Medicare + self-employment tax).
        </p>
        <Show
          keyed
          when={chartData()}
          fallback={
            <p class="text-sm text-faint-foreground">
              Enter income, or load a sample in Try a sample / Share above, to see the chart.
            </p>
          }
        >
          {(data) => (
            <div class="rounded-lg border border-border-subtle bg-surface-alt p-4">
              <MekkoSummary data={data} />
              <MekkoRows data={data} />
            </div>
          )}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
