/**
 * Single entry point for federal + payroll modeling. Produces {@link TaxResult} consumed by the
 * summary table, Sankey, and Mekko; charts do not recompute tax—only layout and allocation rules.
 *
 * **Data flow (registry evaluation contract):**
 *
 * 1. Resolve tax rules only: {@link getTaxYearConfig} from the form’s tax year (no tax math).
 * 2. **Form data** + **{@link TaxYearConfig}** feed {@link computeTaxMetricLines}, which loops
 *    {@link TAX_CALC_REGISTRY} in order. Each `compute(ctx)` reads form rows, config, and
 *    {@link ChartMetricComputeContext.accreted} state filled by prior steps in the same pass.
 * 3. Row → {@link TaxCalculationInputs} via {@link rowsToTaxCalculationInputs} is normalization
 *    for the model, not a separate pipeline precompute (see `chartMetricsRegistry` module header).
 */
import { computeTaxMetricLines } from "~/lib/config/chartMetricsRegistry";
import { clampTaxFormData } from "~/lib/taxCalc.clamp";
import { buildTaxResultDisplayBundle } from "~/lib/taxResult.display";
import type { TaxFormData, TaxMetricLine, TaxResult, TaxComputedRow, TaxComputedSegmentRow } from "~/lib/taxForm.types";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import { getTaxYearConfig } from "~/lib/taxData";
import { getTaxYearFromRows, rowsToTaxCalculationInputs } from "~/lib/taxCalc.inputs";
import { getConfigItems, type configItem } from "~/lib/config/page/Page.config";

export type CalculatedConfigItem = configItem & { computedValue: number };

export function calculateAllConfigValues(
  formData: TaxFormData,
  taxData: TaxYearConfig,
  filingStatus: FilingStatus
): CalculatedConfigItem[] {
  const items = getConfigItems(taxData, filingStatus);
  return items.map(item => ({
    ...item,
    computedValue: item.calculate?.(formData.rows, taxData, filingStatus) ?? 0,
  }));
}

function metricLinesToComputedRows(lines: readonly TaxMetricLine[]): (TaxComputedRow | TaxComputedSegmentRow)[] {
  const rows: (TaxComputedRow | TaxComputedSegmentRow)[] = [];
  for (const line of lines) {
    if (line.valueKind === "number") {
      const v = line.value;
      rows.push({
        type: "computed",
        id: line.metricsKey,
        value: typeof v === "number" && Number.isFinite(v) ? v : 0,
      });
    }
  }
  return rows;
}


export function calculateTaxes(raw: TaxFormData, config?: TaxYearConfig): TaxResult | null {
  const data = clampTaxFormData(raw);
  const taxYear = getTaxYearFromRows(data.rows);
  const taxConfig = config ?? getTaxYearConfig(taxYear);
  if (!taxConfig) {
    return null;
  }
  const inputs = rowsToTaxCalculationInputs(data.rows);

  let metricLines: TaxMetricLine[];
  try {
    metricLines = computeTaxMetricLines(data.rows, inputs, taxConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      rows: [...data.rows],
      notes: [],
      errors: [`Tax calculation error: ${message}`],
    };
  }

  const computedRows = metricLinesToComputedRows(metricLines);
  const rows: TaxResult["rows"] = [...(data.rows), ...computedRows];
  const base: TaxResult = {
    rows,
    metricLines,
    notes: [],
    errors: [],
  };
  return {
    ...base,
    display: buildTaxResultDisplayBundle(base),
  };
}
