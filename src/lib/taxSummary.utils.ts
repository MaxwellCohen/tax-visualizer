import { createMemo, Accessor } from "solid-js";
import type { CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import { calculateAllConfigValues } from "~/lib/taxCalc.calculateTaxes";
import { getTaxYearFromRows, getFilingStatusFromRows } from "~/lib/taxCalc.inputs";

type CalculatedConfigSource = {
  taxInput: Accessor<{ rows: any[] }>;
  isPlanningYear: Accessor<boolean>;
};

/** Shared utility to compute calculatedConfig from tax input, similar to HomeTaxResults pattern */
export function useCalculatedConfig(source: CalculatedConfigSource): Accessor<CalculatedConfigItem[] | null> {
  return createMemo(() => {
    const input = source.taxInput();
    const rows = input.rows;
    const taxYear = getTaxYearFromRows(rows);
    const taxData = getTaxYearConfig(taxYear);
    if (!taxData) return null;
    const filingStatus = getFilingStatusFromRows(rows);
    return calculateAllConfigValues(input, taxData, filingStatus);
  });
}

/** Get tax year config from tax year value */
function getTaxYearConfig(taxYear: number): any | null {
  const { getTaxYearConfig } = require("~/lib/taxData");
  return getTaxYearConfig(taxYear);
}

/** Format computed value based on item properties */
function formatValue(value: number, format?: string): string {
  switch (format) {
    case "percent":
      return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
    case "number":
      return new Intl.NumberFormat("en-US").format(value);
    default:
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }
}

/** Derive TaxResult metrics from calculatedConfig items */
export function metricsFromConfig(config: any[] | null | undefined): any[] {
  if (!config?.length) return [];
  return config
    .filter((item: any) => item.computedValue > 0)
    .map((item) => ({
      id: item.id,
      label: item.label,
      value: formatValue(item.computedValue, item.format),
      category: item.category || "tax",
      displayOrder: item.displayOrder || 0,
      highlight: item.highlight || false,
    }))
    .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

/** Derive footnotes from calculatedConfig items */
export function footnotesFromConfig(config: any[] | null | undefined): any[] {
  if (!config?.length) return [];
  const footnoteItems = config.filter(
    (item: any) =>
      ["effective-rate-formula", "take-home-formula", "pretax-breakdown", "federal-tax-breakdown", "taxable-income-breakdown", "payroll-breakdown"].includes(
        item.id
      ) && item.computedValue > 0
  );
  return footnoteItems.map((item: any) => ({
    id: item.id,
    text: item.label,
    displayOrder: item.displayOrder || 0,
  }));
}
