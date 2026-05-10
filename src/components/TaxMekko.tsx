import { Accessor, For, Show, createMemo } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import {
  buildMekkoFromConfig,
  type MekkoChartData,
  type MekkoRow,
} from "~/lib/taxCharts.buildMekko";
import { money } from "~/lib/moneyFormat";

type TaxMekkoProps = {
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function bandTitle(row: MekkoRow): string {
  if (row.chartRole === "pretax") {
    return `${row.label}: ${money.format(row.total)} deferred (payroll pre-tax & deductible IRA).`;
  }
  if (row.chartRole === "seAdjustment") {
    return `${row.label}: ${money.format(row.total)} deductible against ordinary income (not cash).`;
  }
  if (row.chartRole === "payrollTax") {
    return `${row.label}: ${money.format(row.total)} wage Social Security & Medicare.`;
  }
  if (row.chartRole === "deduction") {
    return `${row.label}: ${money.format(row.total)} shielded by standard or itemized deduction.`;
  }
  return `${row.label}: federal tax ${money.format(row.tax)}; ${money.format(row.keep)} remains before payroll tax.`;
}

function share(value: number, total: number): number {
  return total > 0 ? Math.max(0, value / total) : 0;
}

function MekkoSummary(props: { data: MekkoChartData }) {
  const d = props.data;
  const takeShare = share(d.takeHomePay, d.totalIncome);
  const pretaxShare = share(d.preTaxTotal + d.traditionalIra, d.totalIncome);
  const taxShare = share(d.federalIncomeTax + d.payrollTax, d.totalIncome);

  return (
    <div class="mb-4">
      <div
        class="text-center text-[10px]"
        style={{ color: "var(--text-muted)" }}
      >
        Cash, pre-tax & taxes (share of gross)
      </div>
      <div
        class="mb-2 text-center text-[9px]"
        style={{ color: "var(--text-faint)" }}
      >
        {`Payroll tax ${money.format(d.payrollTax)}${
          d.federalTaxCreditsApplied > 0
            ? ` · Federal credits applied ${money.format(d.federalTaxCreditsApplied)}`
            : ""
        }`}
      </div>
      <div class="flex h-5 overflow-hidden rounded-sm">
        <div
          style={{
            width: `${takeShare * 100}%`,
            background: "var(--chart-keep)",
          }}
          class="flex items-center justify-center text-[10px]"
          title={`Take-home pay ${money.format(d.takeHomePay)} (${pct.format(takeShare)})`}
        >
          {pct.format(takeShare)}
        </div>
        <div
          style={{
            width: `${pretaxShare * 100}%`,
            background: "var(--chart-pretax)",
          }}  
          class="flex items-center justify-center text-[10px]"
          title={`Payroll pre-tax & deductible IRA ${money.format(d.preTaxTotal + d.traditionalIra)} (${pct.format(pretaxShare)})`}
        >
          {pct.format(pretaxShare)}
        </div>
        <div
          style={{
            width: `${taxShare * 100}%`,
            background: "var(--chart-tax)",
          }}
          class="flex items-center justify-center text-[10px]" 
          title={`Taxes ${money.format(d.federalIncomeTax + d.payrollTax)} (${pct.format(taxShare)})`}
        >
          {pct.format(taxShare)}
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
    <div
      class="flex h-110 flex-col-reverse rounded-lg border"
      style={{ "border-color": "var(--border-subtle)" }}
    >
      <For each={d.rows}>
        {(row) => {
          const keepShare = share(row.keep, row.total);
          const taxShare = share(row.tax, row.total);
          const rowShare = share(row.total, visualTotal);
          const title = bandTitle(row);

          return (
            <div
              class="flex min-h-4.5 items-stretch"
              style={{ height: `${rowShare * 100}%` }}
            >
              <div
                class="flex w-32 shrink-0 items-center justify-end pr-3 text-right text-[11px]"
                style={{ color: "var(--sankey-label)" }}
              >
                {row.label}
              </div>
              <div class="flex min-w-0 flex-1">
                <div
                  class="flex items-center justify-center text-[10px]"
                  style={{
                    width: `${keepShare * 100}%`,
                    background: row.fill,
                    border: `0.5px solid ${row.stroke}`,
                    color: "var(--mekko-segment-label)",
                  }}
                  title={title}
                >
                  {money.format(row.keep)}
                </div>
                <Show when={row.tax > 0}>
                  <div
                    class="flex items-center justify-center text-[10px]"
                    style={{
                      width: `${taxShare * 100}%`,
                      background: row.taxFill,
                      border: `0.5px solid ${row.taxStroke}`,
                      color: "var(--mekko-segment-label)",
                    }}
                    title={title}
                  >
                    {money.format(row.tax)}
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
    <section
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <CollapsibleBlock
        title="Income & federal brackets (Mekko)"
        bodyClass="mt-4"
      >
        <p
          class="mb-4 max-w-3xl text-xs leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          How to read this: the <strong>left axis is gross income</strong> (same
          as “Total Income”). From bottom to top, bands are{" "}
          <strong>pre-tax deferrals</strong>, the <strong>½ SE tax</strong>{" "}
          deduction (if any), <strong>deduction shield</strong>{" "}
          (standard/itemized on ordinary, net of wage payroll taxes carved out),{" "}
          <strong>wage payroll taxes</strong> (FICA taken from that same shield
          pool), then <strong>ordinary federal brackets</strong> (green / red),
          then <strong>long-term gains</strong>. Together they fill gross. The
          line under the summary bar shows total payroll tax and federal
          credits. The bar above is take-home vs pre-tax deferrals vs all taxes
          (income + payroll).
        </p>
        <Show
          keyed
          when={chartData()}
          fallback={
            <p class="text-sm" style={{ color: "var(--text-faint)" }}>
              Enter income to see the chart.
            </p>
          }
        >
          {(data) => (
            <div
              class="rounded-lg p-4"
              style={{
                background: "var(--surface-alt)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <MekkoSummary data={data} />
              <MekkoRows data={data} />
            </div>
          )}
        </Show>
      </CollapsibleBlock>
    </section>
  );
}
